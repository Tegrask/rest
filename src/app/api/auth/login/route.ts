import { prisma } from "@/lib/db";
import { createSession, verifyPassword, verifyNxcodeToken } from "@/lib/auth";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const localSchema = z.object({
  provider: z.literal("local"),
  email: z.string().email(),
  password: z.string().min(1),
});

const nxcodeSchema = z.object({
  provider: z.literal("nxcode"),
  token: z.string().min(1),
});

const loginSchema = z.union([localSchema, nxcodeSchema]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = loginSchema.parse(body);

    if (data.provider === "local") {
      const user = await prisma.user.findUnique({ where: { email: data.email } });
      if (!user || !user.password) {
        return Response.json({ error: "Invalid credentials" }, { status: 401 });
      }

      const valid = await verifyPassword(data.password, user.password);
      if (!valid) {
        return Response.json({ error: "Invalid credentials" }, { status: 401 });
      }

      await createSession({
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });

      return Response.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    }

    const appId = process.env.NXCODE_APP_ID || process.env.NEXT_PUBLIC_NXCODE_APP_ID;
    if (!appId) {
      return Response.json({ error: "Nxcode is not configured" }, { status: 400 });
    }

    const nxcodeUser = await verifyNxcodeToken(data.token, appId);
    if (!nxcodeUser) {
      return Response.json({ error: "Invalid Nxcode token" }, { status: 401 });
    }

    let user = await prisma.user.findUnique({ where: { email: nxcodeUser.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: nxcodeUser.email,
          name: nxcodeUser.name || nxcodeUser.email,
          role: "STAFF",
        },
      });
    }

    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return Response.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues }, { status: 400 });
    }
    console.error("Login error", error);
    return Response.json({ error: "Login failed" }, { status: 500 });
  }
}
