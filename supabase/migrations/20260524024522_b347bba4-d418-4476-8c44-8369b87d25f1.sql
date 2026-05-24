
CREATE TABLE IF NOT EXISTS public.ad_events_daily (
  placement_id uuid NOT NULL,
  day date NOT NULL,
  impressions bigint NOT NULL DEFAULT 0,
  clicks bigint NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (placement_id, day)
);

CREATE INDEX IF NOT EXISTS ad_events_daily_day_idx ON public.ad_events_daily (day DESC);

ALTER TABLE public.ad_events_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ad_events_daily admin read"
  ON public.ad_events_daily FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "ad_events_daily admin write"
  ON public.ad_events_daily FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
