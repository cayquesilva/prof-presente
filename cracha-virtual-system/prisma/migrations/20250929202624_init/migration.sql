-- CreateIndex
CREATE INDEX "awards_createdAt_idx" ON "public"."awards"("createdAt");

-- CreateIndex
CREATE INDEX "badges_issuedAt_idx" ON "public"."badges"("issuedAt");

-- CreateIndex
CREATE INDEX "badges_validUntil_idx" ON "public"."badges"("validUntil");

-- CreateIndex
CREATE INDEX "badges_createdAt_idx" ON "public"."badges"("createdAt");

-- CreateIndex
CREATE INDEX "checkins_badgeId_idx" ON "public"."checkins"("badgeId");

-- CreateIndex
CREATE INDEX "checkins_checkinTime_idx" ON "public"."checkins"("checkinTime");

-- CreateIndex
CREATE INDEX "checkins_createdAt_idx" ON "public"."checkins"("createdAt");

-- CreateIndex
CREATE INDEX "course_evaluations_rating_idx" ON "public"."course_evaluations"("rating");

-- CreateIndex
CREATE INDEX "course_evaluations_evaluatedAt_idx" ON "public"."course_evaluations"("evaluatedAt");

-- CreateIndex
CREATE INDEX "course_evaluations_createdAt_idx" ON "public"."course_evaluations"("createdAt");

-- CreateIndex
CREATE INDEX "enrollments_userId_idx" ON "public"."enrollments"("userId");

-- CreateIndex
CREATE INDEX "enrollments_eventId_idx" ON "public"."enrollments"("eventId");

-- CreateIndex
CREATE INDEX "enrollments_status_idx" ON "public"."enrollments"("status");

-- CreateIndex
CREATE INDEX "enrollments_enrollmentDate_idx" ON "public"."enrollments"("enrollmentDate");

-- CreateIndex
CREATE INDEX "events_startDate_idx" ON "public"."events"("startDate");

-- CreateIndex
CREATE INDEX "events_endDate_idx" ON "public"."events"("endDate");

-- CreateIndex
CREATE INDEX "events_createdAt_idx" ON "public"."events"("createdAt");

-- CreateIndex
CREATE INDEX "user_awards_userId_idx" ON "public"."user_awards"("userId");

-- CreateIndex
CREATE INDEX "user_awards_awardId_idx" ON "public"."user_awards"("awardId");

-- CreateIndex
CREATE INDEX "user_awards_awardedAt_idx" ON "public"."user_awards"("awardedAt");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "public"."users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "public"."users"("role");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "public"."users"("createdAt");
