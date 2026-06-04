const getShowtimeStartValue = (event) => {
  if (!event) return null;
  if (event.start_time || event.startTime || event.started_at || event.show_time || event.showTime) {
    return event.start_time || event.startTime || event.started_at || event.show_time || event.showTime;
  }
  if ((event.show_date || event.showDate) && (event.time || event.start_hour || event.startHour)) {
    return `${event.show_date || event.showDate}T${event.time || event.start_hour || event.startHour}`;
  }
  return null;
};

const getShowtimeEndValue = (event) =>
  event?.end_time ||
  event?.endTime ||
  event?.ended_at ||
  event?.finish_time ||
  event?.finishTime ||
  event?.completed_at ||
  null;

const parseShowtimeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) return date;

  if (typeof value === "string") {
    const normalizedDate = new Date(value.replace(" ", "T"));
    if (!Number.isNaN(normalizedDate.getTime())) return normalizedDate;
  }

  return null;
};

export const isShowtimeVisible = (event, now = Date.now()) => {
  const endDate = parseShowtimeDate(getShowtimeEndValue(event));
  if (endDate) return endDate.getTime() > now;

  const startDate = parseShowtimeDate(getShowtimeStartValue(event));
  if (startDate) return startDate.getTime() > now;

  return true;
};
