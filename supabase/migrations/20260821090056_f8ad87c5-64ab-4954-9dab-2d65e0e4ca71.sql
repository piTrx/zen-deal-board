
-- CONTACTS
DROP POLICY IF EXISTS "Authenticated users can view contacts" ON public.contacts;
DROP POLICY IF EXISTS "Creator can update own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Creator can delete own contacts" ON public.contacts;
CREATE POLICY "Team members can view contacts"
ON public.contacts FOR SELECT TO authenticated
USING (auth.uid() = created_by OR public.is_team_member(auth.uid(), created_by));

-- DEALS
DROP POLICY IF EXISTS "Authenticated users can view deals" ON public.deals;
DROP POLICY IF EXISTS "Owner can update own deals" ON public.deals;
DROP POLICY IF EXISTS "Owner can delete own deals" ON public.deals;
CREATE POLICY "Team members can view deals"
ON public.deals FOR SELECT TO authenticated
USING (auth.uid() = owner_id OR auth.uid() = created_by OR public.is_team_member(auth.uid(), owner_id) OR public.is_team_member(auth.uid(), created_by));

-- COMPANIES
DROP POLICY IF EXISTS "Authenticated users can view companies" ON public.companies;
CREATE POLICY "Team members can view companies"
ON public.companies FOR SELECT TO authenticated
USING (auth.uid() = created_by OR public.is_team_member(auth.uid(), created_by));

-- ACTIVITIES
DROP POLICY IF EXISTS "Users can view own activities" ON public.activities;
CREATE POLICY "Team members can view activities"
ON public.activities FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_team_member(auth.uid(), user_id));

-- PIPELINES
DROP POLICY IF EXISTS "Authenticated users can view pipelines" ON public.pipelines;
DROP POLICY IF EXISTS "Users can view pipelines" ON public.pipelines;
CREATE POLICY "Team members can view pipelines"
ON public.pipelines FOR SELECT TO authenticated
USING (auth.uid() = created_by OR public.is_team_member(auth.uid(), created_by));

-- PIPELINE STAGES
DROP POLICY IF EXISTS "Admins and managers can manage stages" ON public.pipeline_stages;
DROP POLICY IF EXISTS "Authenticated users can view stages" ON public.pipeline_stages;
DROP POLICY IF EXISTS "Users can view stages" ON public.pipeline_stages;
CREATE POLICY "Team members can view stages"
ON public.pipeline_stages FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.pipelines p
  WHERE p.id = pipeline_stages.pipeline_id
    AND (p.created_by = auth.uid() OR public.is_team_member(auth.uid(), p.created_by))
));
CREATE POLICY "Team admins and managers can manage stages"
ON public.pipeline_stages FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.pipelines p
  WHERE p.id = pipeline_stages.pipeline_id
    AND (p.created_by = auth.uid() OR public.is_team_member(auth.uid(), p.created_by))
    AND (p.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role))
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.pipelines p
  WHERE p.id = pipeline_stages.pipeline_id
    AND (p.created_by = auth.uid() OR public.is_team_member(auth.uid(), p.created_by))
    AND (p.created_by = auth.uid() OR public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'manager'::app_role))
));
