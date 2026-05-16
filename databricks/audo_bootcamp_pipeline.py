# Databricks notebook source
# Audo Bootcamp Azure Pipeline
# Imports a temporary ADF export from ADLS Gen2, creates Delta tables, and prints
# demo-ready metrics for the AI bootcamp presentation.

# COMMAND ----------

from pyspark.sql import functions as F

dbutils.widgets.text("raw_path", "dbfs:/FileStore/audo_bootcamp/audo-export.json")
dbutils.widgets.text("output_path", "dbfs:/FileStore/audo_bootcamp/delta")

raw_path = dbutils.widgets.get("raw_path")
output_path = dbutils.widgets.get("output_path").rstrip("/")

print(f"Reading Audo export from: {raw_path}")
print(f"Writing Delta outputs to: {output_path}")

# COMMAND ----------

raw = spark.read.option("multiline", "true").json(raw_path)

audits = raw.select(F.explode_outer("audits").alias("audit")).select("audit.*")
agent_sessions = raw.select(F.explode_outer("agent_sessions").alias("session")).select("session.*")
agent_events = raw.select(F.explode_outer("agent_events").alias("event")).select("event.*")
workflow_tasks = raw.select(F.explode_outer("workflow_tasks").alias("task")).select("task.*")
run_metrics = raw.select(
    "schema_version",
    "exported_at",
    F.col("counts.audits").alias("audit_count"),
    F.col("counts.agent_sessions").alias("agent_session_count"),
    F.col("counts.agent_events").alias("agent_event_count"),
    F.col("counts.workflow_tasks").alias("workflow_task_count"),
    F.col("metrics.average_performance_score").alias("average_performance_score"),
    F.col("metrics.average_ux_score").alias("average_ux_score"),
    F.col("metrics.average_seo_score").alias("average_seo_score"),
    F.col("metrics.open_checklist_items").alias("open_checklist_items"),
)

# COMMAND ----------

audits.write.format("delta").mode("overwrite").save(f"{output_path}/audits")
agent_sessions.write.format("delta").mode("overwrite").save(f"{output_path}/agent_sessions")
agent_events.write.format("delta").mode("overwrite").save(f"{output_path}/agent_events")
workflow_tasks.write.format("delta").mode("overwrite").save(f"{output_path}/workflow_tasks")
run_metrics.write.format("delta").mode("overwrite").save(f"{output_path}/run_metrics")

print("Delta tables written.")

# COMMAND ----------

event_counts = (
    agent_events
    .groupBy("event_type")
    .count()
    .orderBy(F.desc("count"))
)

severity_counts = (
    agent_events
    .groupBy("severity")
    .count()
    .orderBy(F.desc("count"))
)

site_scoreboard = (
    audits
    .select(
        "id",
        "website_url",
        "status",
        "performance_score",
        "ux_score",
        "seo_score",
        F.col("checklist_stats.total").alias("checklist_total"),
        F.col("checklist_stats.open").alias("checklist_open"),
        F.col("checklist_stats.completed").alias("checklist_completed"),
        "created_at",
    )
    .orderBy(F.desc("created_at"))
)

demo_readiness = (
    run_metrics
    .withColumn(
        "demo_readiness_score",
        F.least(
            F.lit(100),
            F.greatest(
                F.lit(0),
                F.lit(55)
                + F.coalesce(F.col("agent_session_count"), F.lit(0)) * F.lit(5)
                + F.coalesce(F.col("agent_event_count"), F.lit(0)) * F.lit(1)
                - F.coalesce(F.col("open_checklist_items"), F.lit(0)) * F.lit(2),
            ),
        ),
    )
)

# COMMAND ----------

display(demo_readiness)
display(site_scoreboard)
display(event_counts)
display(severity_counts)

# COMMAND ----------

summary = demo_readiness.collect()[0].asDict()
dbutils.notebook.exit({
    "status": "ok",
    "audit_count": int(summary.get("audit_count") or 0),
    "agent_event_count": int(summary.get("agent_event_count") or 0),
    "open_checklist_items": int(summary.get("open_checklist_items") or 0),
    "demo_readiness_score": int(summary.get("demo_readiness_score") or 0),
})
