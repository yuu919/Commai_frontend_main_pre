type TelemetryPayload = Record<string, unknown>;

class Telemetry {
  // 将来ここを実ログ送信に差し替え（DataDog/GTM など）
  log(eventName: string, payload: TelemetryPayload = {}): void {
    if (process.env.NODE_ENV !== "production") {
       
      console.debug(`[telemetry] ${eventName}`, payload);
    }
  }
}

export const telemetry = new Telemetry();


