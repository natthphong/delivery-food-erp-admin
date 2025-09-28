const BANGKOK_OFFSET_MINUTES = 7 * 60;

export function toBangkokIso(input: string | number | Date) {
  const date = input instanceof Date ? new Date(input.getTime()) : new Date(input);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 19) + "+07:00";
  }

  const utcMilliseconds = date.getTime() + date.getTimezoneOffset() * 60000;
  const bangkokMilliseconds = utcMilliseconds + BANGKOK_OFFSET_MINUTES * 60000;
  const bangkokDate = new Date(bangkokMilliseconds);
  const iso = bangkokDate.toISOString();
  return iso.slice(0, 19) + "+07:00";
}
