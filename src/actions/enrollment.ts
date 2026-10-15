"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "https://supabase-supabase-8fc5f7-185-205-244-119.sslip.io";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase configuration");
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface PayPalCapturePayload {
  orderId: string;
  courseId: string;
  userId: string;
  userEmail: string;
  transactionId?: string;
}

/**
 * Grants course entitlement upon successful PayPal transaction capture
 */
export async function grantCourseEntitlementAction(payload: PayPalCapturePayload) {
  const { courseId, userId, userEmail, transactionId, orderId } = payload;
  const supabase = getAdminSupabase();

  // 1. Insert active enrollment in app_akstack_lms_course_enrollments
  const { data: enrollment, error } = await supabase
    .from("app_akstack_lms_course_enrollments")
    .upsert(
      {
        user_id: userId,
        course_id: courseId,
        payment_provider: "paypal",
        transaction_id: transactionId || orderId,
        status: "active",
        enrolled_at: new Date().toISOString(),
      },
      { onConflict: "user_id,course_id" }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Entitlement provisioning failed: ${error.message}`);
  }

  // 2. Trigger confirmation email via Resend if RESEND_API_KEY is present
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "AKStack LMS <courses@akstack.io>",
          to: [userEmail],
          subject: "Your Course Access is Confirmed — AKStack Enterprise LMS",
          html: `<p>Welcome aboard! Your enrollment for course ID <strong>${courseId}</strong> is active.</p><p>Transaction: ${transactionId || orderId}</p>`,
        }),
      });
    } catch (emailErr) {
      console.warn("Email dispatch failed (non-blocking):", emailErr);
    }
  }

  // Revalidate relevant routes
  revalidatePath(`/courses/[courseSlug]`, "layout");
  revalidatePath("/dashboard");
  return { success: true, enrollment };
}
