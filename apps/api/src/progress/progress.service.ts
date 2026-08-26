import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SyncDto } from "./dto/progress.dto";

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  /** Toàn bộ tiến độ của một người học, để client nạp lúc đăng nhập. */
  async snapshot(userId: string) {
    const [kanaStats, srsCards, attempts] = await Promise.all([
      this.prisma.kanaStat.findMany({
        where: { userId },
        select: { kanaKey: true, correct: true, wrong: true, streak: true, updatedAt: true },
      }),
      this.prisma.srsCard.findMany({
        where: { userId },
        select: { cardId: true, deckId: true, box: true, dueDay: true, updatedAt: true },
      }),
      this.prisma.testAttempt.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          type: true,
          level: true,
          total: true,
          correct: true,
          seconds: true,
          createdAt: true,
        },
      }),
    ]);

    return { kanaStats, srsCards, attempts };
  }

  /**
   * Đồng bộ hai chiều. Client gửi lên trạng thái cục bộ, server trộn rồi
   * trả về trạng thái đã hợp nhất.
   *
   * Quy tắc trộn có chủ ý, không phải "bên nào ghi sau thì thắng":
   *  - kana: cộng dồn không được (dễ nhân đôi khi gửi lại), nên lấy bản có
   *    tổng lượt ôn lớn hơn — tức bản chứa nhiều lịch sử học hơn.
   *  - SRS: lấy hộp cao hơn; nếu bằng hộp thì lấy hạn ôn xa hơn.
   *  - lịch sử thi: chỉ thêm mới, không bao giờ sửa hay xóa.
   */
  async sync(userId: string, dto: SyncDto) {
    const now = new Date();

    if (dto.kanaStats?.length) {
      const existing = await this.prisma.kanaStat.findMany({
        where: { userId, kanaKey: { in: dto.kanaStats.map((s) => s.kanaKey) } },
      });
      const byKey = new Map(existing.map((s) => [s.kanaKey, s]));

      for (const incoming of dto.kanaStats) {
        const current = byKey.get(incoming.kanaKey);
        const incomingTotal = incoming.correct + incoming.wrong;
        const currentTotal = current ? current.correct + current.wrong : -1;
        if (current && currentTotal >= incomingTotal) continue;

        await this.prisma.kanaStat.upsert({
          where: { userId_kanaKey: { userId, kanaKey: incoming.kanaKey } },
          update: { correct: incoming.correct, wrong: incoming.wrong, streak: incoming.streak },
          create: {
            userId,
            kanaKey: incoming.kanaKey,
            correct: incoming.correct,
            wrong: incoming.wrong,
            streak: incoming.streak,
          },
        });
      }
    }

    if (dto.srsCards?.length) {
      const existing = await this.prisma.srsCard.findMany({
        where: { userId, cardId: { in: dto.srsCards.map((c) => c.cardId) } },
      });
      const byId = new Map(existing.map((c) => [c.cardId, c]));

      for (const incoming of dto.srsCards) {
        const current = byId.get(incoming.cardId);
        if (current) {
          const keepCurrent =
            current.box > incoming.box ||
            (current.box === incoming.box && current.dueDay >= incoming.dueDay);
          if (keepCurrent) continue;
        }

        await this.prisma.srsCard.upsert({
          where: { userId_cardId: { userId, cardId: incoming.cardId } },
          update: { box: incoming.box, dueDay: incoming.dueDay, deckId: incoming.deckId },
          create: {
            userId,
            cardId: incoming.cardId,
            deckId: incoming.deckId,
            box: incoming.box,
            dueDay: incoming.dueDay,
          },
        });
      }
    }

    if (dto.attempts?.length) {
      // Chống gửi trùng: bỏ qua lần thi đã có cùng mốc thời gian.
      const stamps = dto.attempts.map((a) => new Date(a.createdAt));
      const existing = await this.prisma.testAttempt.findMany({
        where: { userId, createdAt: { in: stamps } },
        select: { createdAt: true },
      });
      const seen = new Set(existing.map((a) => a.createdAt.getTime()));

      const fresh = dto.attempts.filter((a) => !seen.has(new Date(a.createdAt).getTime()));
      if (fresh.length) {
        await this.prisma.testAttempt.createMany({
          data: fresh.map((a) => ({
            userId,
            type: a.type,
            level: a.level,
            total: a.total,
            correct: a.correct,
            seconds: a.seconds,
            createdAt: new Date(a.createdAt),
          })),
        });
      }
    }

    return { syncedAt: now.toISOString(), ...(await this.snapshot(userId)) };
  }

  async reset(userId: string) {
    await this.prisma.$transaction([
      this.prisma.kanaStat.deleteMany({ where: { userId } }),
      this.prisma.srsCard.deleteMany({ where: { userId } }),
      this.prisma.testAttempt.deleteMany({ where: { userId } }),
    ]);
    return { ok: true as const };
  }

  /** Số liệu tổng hợp cho trang tài khoản. */
  async summary(userId: string) {
    const [kanaAgg, mastered, dueToday, attempts] = await Promise.all([
      this.prisma.kanaStat.aggregate({
        where: { userId },
        _sum: { correct: true, wrong: true },
      }),
      this.prisma.srsCard.count({ where: { userId, box: { gte: 4 } } }),
      this.prisma.srsCard.count({
        where: { userId, dueDay: { lte: Math.floor(Date.now() / 86_400_000) } },
      }),
      this.prisma.testAttempt.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    const correct = kanaAgg._sum.correct ?? 0;
    const wrong = kanaAgg._sum.wrong ?? 0;

    return {
      kana: {
        correct,
        wrong,
        accuracy: correct + wrong > 0 ? Math.round((correct / (correct + wrong)) * 100) : null,
      },
      srs: { mastered, dueToday },
      recentAttempts: attempts,
    };
  }
}
