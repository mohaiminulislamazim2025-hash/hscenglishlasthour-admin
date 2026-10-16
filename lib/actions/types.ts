export interface ActionResult {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}

export function actionError(message: string, fieldErrors?: Record<string, string>): ActionResult {
  return { ok: false, message, ...(fieldErrors ? { fieldErrors } : {}) };
}

export function actionSuccess(message?: string): ActionResult {
  return { ok: true, ...(message ? { message } : {}) };
}
