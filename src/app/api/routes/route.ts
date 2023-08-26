import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const response = await fetch(`http://localhost:3333/routes`, {
    next: {
      revalidate: 60,
      tags: ['routes'],
    }
  });

  return NextResponse.json(await response.json());
}

export async function POST(request: NextRequest) {
  const response = await fetch(`http://localhost:3333/routes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(await request.json()),
  });
  revalidateTag('routes');

  return NextResponse.json(await response.json());
}

