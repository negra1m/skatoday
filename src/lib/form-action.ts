// Util pra invocar Server Action via FormData sem precisar de <form>.
export function invokeAction(
  action: (formData: FormData) => Promise<void>,
  fields: Record<string, string>,
) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return action(fd);
}
