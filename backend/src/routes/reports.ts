import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { db } from "../../lib/db";
import { reports } from "../../lib/schema";
import { eq, desc, and, sql } from "drizzle-orm";

// Type definitions
interface ReportSubmissionRequest {
  reportId: string;
  reportType: string;
  contentType: "asset" | "collection" | "profile";
  contentId: string;
  contentTitle: string;
  contentOwner?: string;
  reporterWallet: string;
  reporterUserId: string;
  description: string;
  timestamp: string;
  status: "pending" | "under_review" | "resolved" | "dismissed";
  source: string;
  version: string;
}

interface ReportSubmissionResponse {
  success: boolean;
  reportId: string;
  message: string;
  timestamp: string;
}

interface ReportListResponse {
  success: boolean;
  reports: any[];
  total: number;
  page: number;
  limit: number;
}

// Validation schemas
const reportSubmissionSchema = {
  type: "object",
  required: [
    "reportId",
    "reportType", 
    "contentType",
    "contentId",
    "contentTitle",
    "reporterWallet",
    "reporterUserId",
    "description"
  ],
  properties: {
    reportId: { type: "string", minLength: 1 },
    reportType: { type: "string", minLength: 1 },
    contentType: { type: "string", enum: ["asset", "collection", "profile"] },
    contentId: { type: "string", minLength: 1 },
    contentTitle: { type: "string", minLength: 1 },
    contentOwner: { type: "string" },
    reporterWallet: { type: "string", minLength: 1 },
    reporterUserId: { type: "string", minLength: 1 },
    description: { type: "string", minLength: 10, maxLength: 1000 },
    timestamp: { type: "string" },
    status: { type: "string", enum: ["pending", "under_review", "resolved", "dismissed"] },
    source: { type: "string" },
    version: { type: "string" }
  }
};

export async function reportsRoutes(fastify: FastifyInstance) {
  // Submit a new report
  fastify.post<{
    Body: ReportSubmissionRequest;
    Reply: ReportSubmissionResponse;
  }>("/reports/submit", {
    schema: {
      body: reportSubmissionSchema,
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            reportId: { type: "string" },
            message: { type: "string" },
            timestamp: { type: "string" }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Body: ReportSubmissionRequest }>, reply: FastifyReply) => {
    try {
      const reportData = request.body;
      
      // Validate report type
      const validReportTypes = [
        "inappropriate-content",
        "copyright-infringement", 
        "spam",
        "harassment",
        "fake-content",
        "scam",
        "other"
      ];
      
      if (!validReportTypes.includes(reportData.reportType)) {
        return reply.status(400).send({
          success: false,
          reportId: reportData.reportId,
          message: "Invalid report type",
          timestamp: new Date().toISOString()
        });
      }

      // Insert new report (handles race conditions with database-level unique constraint)
      try {
        await db.insert(reports).values({
          id: reportData.reportId,
          reportType: reportData.reportType,
          contentType: reportData.contentType,
          contentId: reportData.contentId,
          contentTitle: reportData.contentTitle,
          contentOwner: reportData.contentOwner || null,
          reporterWallet: reportData.reporterWallet,
          reporterUserId: reportData.reporterUserId,
          description: reportData.description,
          status: reportData.status || "pending",
          source: reportData.source || "mip-dapp",
          version: reportData.version || "1.0"
        });
      } catch (error: any) {
        // Check if it's a unique constraint violation (PostgreSQL error code 23505)
        if (error.code === '23505' || error.message?.includes('unique') || error.message?.includes('duplicate')) {
          return reply.status(409).send({
            success: false,
            reportId: reportData.reportId,
            message: "Report already exists",
            timestamp: new Date().toISOString()
          });
        }
        // Re-throw if it's a different error
        throw error;
      }

      fastify.log.info({
        reportId: reportData.reportId,
        reportType: reportData.reportType,
        contentType: reportData.contentType,
        contentId: reportData.contentId,
        reporterWallet: reportData.reporterWallet
      }, `Report submitted: ${reportData.reportId}`);

      return reply.status(201).send({
        success: true,
        reportId: reportData.reportId,
        message: "Report submitted successfully to Mediolano DAO",
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      fastify.log.error("Error submitting report:", error);
      
      return reply.status(500).send({
        success: false,
        reportId: request.body?.reportId || "unknown",
        message: "Internal server error while processing report",
        timestamp: new Date().toISOString()
      });
    }
  });

  // Get reports list (for moderation dashboard)
  fastify.get<{
    Querystring: {
      page?: string;
      limit?: string;
      status?: string;
      contentType?: string;
    };
    Reply: ReportListResponse;
  }>("/reports", {
    schema: {
      querystring: {
        type: "object",
        properties: {
          page: { type: "string", pattern: "^[0-9]+$" },
          limit: { type: "string", pattern: "^[0-9]+$" },
          status: { type: "string", enum: ["pending", "under_review", "resolved", "dismissed"] },
          contentType: { type: "string", enum: ["asset", "collection", "profile"] }
        }
      },
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            reports: { type: "array" },
            total: { type: "number" },
            page: { type: "number" },
            limit: { type: "number" }
          }
        }
      }
    }
  }, async (request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
    try {
      const query = request.query as { page?: string; limit?: string; status?: string; contentType?: string };
      const page = Math.max(1, parseInt(query.page || "1"));
      const limit = Math.min(parseInt(query.limit || "20"), 100); // Max 100 per page
      const offset = (page - 1) * limit;

      // Build query conditions
      const conditions = [];
      
      if (query.status) {
        conditions.push(eq(reports.status, query.status));
      }
      
      if (query.contentType) {
        conditions.push(eq(reports.contentType, query.contentType));
      }
      
      const dbQuery = conditions.length > 0 
        ? db.select().from(reports).where(and(...conditions))
        : db.select().from(reports);

      // Get total count with same conditions as main query
      const totalResult = conditions.length > 0 
        ? await db
            .select({ count: sql`COUNT(${reports.id})` })
            .from(reports)
            .where(and(...conditions))
        : await db
            .select({ count: sql`COUNT(${reports.id})` })
            .from(reports);
      const total = Number(totalResult[0]?.count || 0);

      // Get paginated results
      const reportsList = await dbQuery
        .orderBy(desc(reports.createdAt))
        .limit(limit)
        .offset(offset);

      return reply.send({
        success: true,
        reports: reportsList,
        total,
        page,
        limit
      });

    } catch (error: any) {
      fastify.log.error("Error fetching reports:", error);
      
      return reply.status(500).send({
        success: false,
        reports: [],
        total: 0,
        page: 1,
        limit: 20
      });
    }
  });

  // Health check for reports service
  fastify.get("/reports/health", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Test database connection
      await db.select().from(reports).limit(1);
      
      return reply.send({
        success: true,
        message: "Reports service is healthy",
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      fastify.log.error("Reports health check failed:", error);
      
      return reply.status(503).send({
        success: false,
        message: "Reports service is unhealthy",
        timestamp: new Date().toISOString()
      });
    }
  });

  // Get specific report by ID
  fastify.get<{
    Params: { id: string };
  }>("/reports/:id", {
    schema: {
      params: {
        type: "object",
        properties: {
          id: { type: "string", minLength: 1 }
        },
        required: ["id"]
      }
    }
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const reportId = request.params.id;
      
      const report = await db
        .select()
        .from(reports)
        .where(eq(reports.id, reportId))
        .limit(1);

      if (report.length === 0) {
        return reply.status(404).send({
          success: false,
          message: "Report not found"
        });
      }

      return reply.send({
        success: true,
        report: report[0]
      });

    } catch (error: any) {
      fastify.log.error("Error fetching report:", error);
      
      return reply.status(500).send({
        success: false,
        message: "Internal server error"
      });
    }
  });

  // Update report status (for moderation)
  fastify.patch<{
    Params: { id: string };
    Body: { status: "pending" | "under_review" | "resolved" | "dismissed" };
  }>("/reports/:id/status", {
    schema: {
      params: {
        type: "object",
        properties: {
          id: { type: "string", minLength: 1 }
        },
        required: ["id"]
      },
      body: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["pending", "under_review", "resolved", "dismissed"] }
        },
        required: ["status"]
      }
    }
  }, async (request: FastifyRequest<{ 
    Params: { id: string }; 
    Body: { status: "pending" | "under_review" | "resolved" | "dismissed" } 
  }>, reply: FastifyReply) => {
    try {
      const reportId = request.params.id;
      const newStatus = request.body.status;

      // Check if report exists
      const existingReport = await db
        .select()
        .from(reports)
        .where(eq(reports.id, reportId))
        .limit(1);

      if (existingReport.length === 0) {
        return reply.status(404).send({
          success: false,
          message: "Report not found"
        });
      }

      // Update status
      await db
        .update(reports)
        .set({ 
          status: newStatus,
          updatedAt: new Date()
        })
        .where(eq(reports.id, reportId));

      fastify.log.info(`Report status updated: ${reportId} -> ${newStatus}`);

      return reply.send({
        success: true,
        message: "Report status updated successfully",
        reportId,
        status: newStatus
      });

    } catch (error: any) {
      fastify.log.error("Error updating report status:", error);
      
      return reply.status(500).send({
        success: false,
        message: "Internal server error"
      });
    }
  });
}
