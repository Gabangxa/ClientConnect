import { db } from "../db";
import { projects, deliverables, invoices, messages, feedback } from "@shared/schema";
import { eq, and, gte, lte, count, sql, desc } from "drizzle-orm";
import { subDays, subMonths, startOfMonth, endOfMonth, format } from "date-fns";

export interface AnalyticsOverview {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalRevenue: number;
  pendingRevenue: number;
  totalDeliverables: number;
  approvedDeliverables: number;
  pendingDeliverables: number;
  totalMessages: number;
  unreadMessages: number;
  averageRating: number;
  totalFeedback: number;
}

export interface ProjectStats {
  byStatus: { status: string; count: number }[];
  recentlyCreated: { id: string; name: string; clientName: string; createdAt: Date }[];
}

export interface RevenueStats {
  totalInvoiced: number;
  totalPaid: number;
  totalPending: number;
  monthlyRevenue: { month: string; paid: number; pending: number }[];
}

export interface ActivityStats {
  messagesPerDay: { date: string; count: number }[];
  deliverablesPerMonth: { month: string; count: number }[];
  feedbackPerMonth: { month: string; count: number; averageRating: number }[];
}

class AnalyticsService {
  async getOverview(freelancerId: string): Promise<AnalyticsOverview> {
    const [projectStats] = await db
      .select({
        total: count(),
        active: sql<number>`SUM(CASE WHEN ${projects.status} = 'active' THEN 1 ELSE 0 END)`,
        completed: sql<number>`SUM(CASE WHEN ${projects.status} = 'completed' THEN 1 ELSE 0 END)`,
      })
      .from(projects)
      .where(eq(projects.freelancerId, freelancerId));

    const freelancerProjects = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.freelancerId, freelancerId));
    
    const projectIds = freelancerProjects.map(p => p.id);

    let deliverableStats = { total: 0, approved: 0, pending: 0 };
    let invoiceStats = { totalInvoiced: 0, totalPaid: 0 };
    let messageStats = { total: 0, unread: 0 };
    let feedbackStats = { total: 0, averageRating: 0 };

    if (projectIds.length > 0) {
      const [delStats] = await db
        .select({
          total: count(),
          approved: sql<number>`SUM(CASE WHEN ${deliverables.status} = 'approved' THEN 1 ELSE 0 END)`,
          pending: sql<number>`SUM(CASE WHEN ${deliverables.status} = 'pending' THEN 1 ELSE 0 END)`,
        })
        .from(deliverables)
        .where(sql`${deliverables.projectId} IN (${sql.join(projectIds.map(id => sql`${id}`), sql`, `)})`);
      
      if (delStats) {
        deliverableStats = { 
          total: delStats.total || 0, 
          approved: Number(delStats.approved) || 0, 
          pending: Number(delStats.pending) || 0 
        };
      }

      const [invStats] = await db
        .select({
          totalInvoiced: sql<number>`COALESCE(SUM(${invoices.amount}), 0)`,
          totalPaid: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'paid' THEN ${invoices.amount} ELSE 0 END), 0)`,
        })
        .from(invoices)
        .where(sql`${invoices.projectId} IN (${sql.join(projectIds.map(id => sql`${id}`), sql`, `)})`);
      
      if (invStats) {
        invoiceStats = { 
          totalInvoiced: Number(invStats.totalInvoiced) || 0, 
          totalPaid: Number(invStats.totalPaid) || 0 
        };
      }

      const [msgStats] = await db
        .select({
          total: count(),
          unread: sql<number>`SUM(CASE WHEN ${messages.isRead} = false THEN 1 ELSE 0 END)`,
        })
        .from(messages)
        .where(sql`${messages.projectId} IN (${sql.join(projectIds.map(id => sql`${id}`), sql`, `)})`);
      
      if (msgStats) {
        messageStats = { total: msgStats.total || 0, unread: Number(msgStats.unread) || 0 };
      }

      const [fbStats] = await db
        .select({
          total: count(),
          averageRating: sql<number>`COALESCE(AVG(${feedback.rating}), 0)`,
        })
        .from(feedback)
        .where(sql`${feedback.projectId} IN (${sql.join(projectIds.map(id => sql`${id}`), sql`, `)})`);
      
      if (fbStats) {
        feedbackStats = { 
          total: fbStats.total || 0, 
          averageRating: Number(fbStats.averageRating) || 0 
        };
      }
    }

    return {
      totalProjects: projectStats?.total || 0,
      activeProjects: Number(projectStats?.active) || 0,
      completedProjects: Number(projectStats?.completed) || 0,
      totalRevenue: invoiceStats.totalPaid,
      pendingRevenue: invoiceStats.totalInvoiced - invoiceStats.totalPaid,
      totalDeliverables: deliverableStats.total,
      approvedDeliverables: deliverableStats.approved,
      pendingDeliverables: deliverableStats.pending,
      totalMessages: messageStats.total,
      unreadMessages: messageStats.unread,
      averageRating: Math.round(feedbackStats.averageRating * 10) / 10,
      totalFeedback: feedbackStats.total,
    };
  }

  async getProjectStats(freelancerId: string): Promise<ProjectStats> {
    const byStatus = await db
      .select({
        status: projects.status,
        count: count(),
      })
      .from(projects)
      .where(eq(projects.freelancerId, freelancerId))
      .groupBy(projects.status);

    const recentlyCreated = await db
      .select({
        id: projects.id,
        name: projects.name,
        clientName: projects.clientName,
        createdAt: projects.createdAt,
      })
      .from(projects)
      .where(eq(projects.freelancerId, freelancerId))
      .orderBy(desc(projects.createdAt))
      .limit(5);

    return {
      byStatus: byStatus.map(s => ({ status: s.status, count: s.count })),
      recentlyCreated: recentlyCreated.map(p => ({
        id: p.id,
        name: p.name,
        clientName: p.clientName,
        createdAt: p.createdAt || new Date(),
      })),
    };
  }

  async getRevenueStats(freelancerId: string): Promise<RevenueStats> {
    const freelancerProjects = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.freelancerId, freelancerId));
    
    const projectIds = freelancerProjects.map(p => p.id);

    if (projectIds.length === 0) {
      return {
        totalInvoiced: 0,
        totalPaid: 0,
        totalPending: 0,
        monthlyRevenue: [],
      };
    }

    const [totals] = await db
      .select({
        totalInvoiced: sql<number>`COALESCE(SUM(${invoices.amount}), 0)`,
        totalPaid: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'paid' THEN ${invoices.amount} ELSE 0 END), 0)`,
        totalPending: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} != 'paid' THEN ${invoices.amount} ELSE 0 END), 0)`,
      })
      .from(invoices)
      .where(sql`${invoices.projectId} IN (${sql.join(projectIds.map(id => sql`${id}`), sql`, `)})`);

    const sixMonthsAgo = subMonths(new Date(), 6);
    const monthlyData = await db
      .select({
        month: sql<string>`TO_CHAR(${invoices.createdAt}, 'YYYY-MM')`,
        paid: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} = 'paid' THEN ${invoices.amount} ELSE 0 END), 0)`,
        pending: sql<number>`COALESCE(SUM(CASE WHEN ${invoices.status} != 'paid' THEN ${invoices.amount} ELSE 0 END), 0)`,
      })
      .from(invoices)
      .where(
        and(
          sql`${invoices.projectId} IN (${sql.join(projectIds.map(id => sql`${id}`), sql`, `)})`,
          gte(invoices.createdAt, sixMonthsAgo)
        )
      )
      .groupBy(sql`TO_CHAR(${invoices.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${invoices.createdAt}, 'YYYY-MM')`);

    return {
      totalInvoiced: Number(totals?.totalInvoiced) || 0,
      totalPaid: Number(totals?.totalPaid) || 0,
      totalPending: Number(totals?.totalPending) || 0,
      monthlyRevenue: monthlyData.map(m => ({
        month: m.month,
        paid: Number(m.paid),
        pending: Number(m.pending),
      })),
    };
  }

  async getActivityStats(freelancerId: string): Promise<ActivityStats> {
    const freelancerProjects = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.freelancerId, freelancerId));
    
    const projectIds = freelancerProjects.map(p => p.id);

    if (projectIds.length === 0) {
      return {
        messagesPerDay: [],
        deliverablesPerMonth: [],
        feedbackPerMonth: [],
      };
    }

    const thirtyDaysAgo = subDays(new Date(), 30);
    const messagesPerDay = await db
      .select({
        date: sql<string>`TO_CHAR(${messages.createdAt}, 'YYYY-MM-DD')`,
        count: count(),
      })
      .from(messages)
      .where(
        and(
          sql`${messages.projectId} IN (${sql.join(projectIds.map(id => sql`${id}`), sql`, `)})`,
          gte(messages.createdAt, thirtyDaysAgo)
        )
      )
      .groupBy(sql`TO_CHAR(${messages.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`TO_CHAR(${messages.createdAt}, 'YYYY-MM-DD')`);

    const sixMonthsAgo = subMonths(new Date(), 6);
    const deliverablesPerMonth = await db
      .select({
        month: sql<string>`TO_CHAR(${deliverables.createdAt}, 'YYYY-MM')`,
        count: count(),
      })
      .from(deliverables)
      .where(
        and(
          sql`${deliverables.projectId} IN (${sql.join(projectIds.map(id => sql`${id}`), sql`, `)})`,
          gte(deliverables.createdAt, sixMonthsAgo)
        )
      )
      .groupBy(sql`TO_CHAR(${deliverables.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${deliverables.createdAt}, 'YYYY-MM')`);

    const feedbackPerMonth = await db
      .select({
        month: sql<string>`TO_CHAR(${feedback.createdAt}, 'YYYY-MM')`,
        count: count(),
        averageRating: sql<number>`COALESCE(AVG(${feedback.rating}), 0)`,
      })
      .from(feedback)
      .where(
        and(
          sql`${feedback.projectId} IN (${sql.join(projectIds.map(id => sql`${id}`), sql`, `)})`,
          gte(feedback.createdAt, sixMonthsAgo)
        )
      )
      .groupBy(sql`TO_CHAR(${feedback.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${feedback.createdAt}, 'YYYY-MM')`);

    return {
      messagesPerDay: messagesPerDay.map(m => ({ date: m.date, count: m.count })),
      deliverablesPerMonth: deliverablesPerMonth.map(d => ({ month: d.month, count: d.count })),
      feedbackPerMonth: feedbackPerMonth.map(f => ({
        month: f.month,
        count: f.count,
        averageRating: Math.round(Number(f.averageRating) * 10) / 10,
      })),
    };
  }
}

export const analyticsService = new AnalyticsService();
