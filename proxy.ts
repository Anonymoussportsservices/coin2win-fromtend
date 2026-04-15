import { NextResponse } from "next/server";

export function proxy(req: any) {
  const url = req.nextUrl;
  const isAgentRoute = url.pathname.startsWith("/agent");
  const isLogin = url.pathname.startsWith("/agent/login");

  const cookie = req.cookies.get("agent_session");

  if (isAgentRoute && !isLogin && !cookie) {
    return NextResponse.redirect(new URL("/agent/login", req.url));
  }

  return NextResponse.next();
}
