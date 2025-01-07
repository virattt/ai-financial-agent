import { registerOTel } from "@vercel/otel";
import { AISDKExporter } from "langsmith/vercel";

export function register() {
  registerOTel({
    serviceName: "ai-financial-agent",
    traceExporter: new AISDKExporter(),
  });
}