import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  CalendarRange,
  Clock3,
  Film,
  MapPin,
  Tag,
} from "lucide-react";
import { eventService } from "../api/eventService";
import ErrorState from "../components/ErrorState";
import LoadingState from "../components/LoadingState";
import { getErrorMessage } from "../utils/errorHandler";
import { isShowtimeVisible } from "../utils/showtimeHelper";
import "../assets/styles/TheaterSchedulePage.css";

const unwrapData = (response) => response?.data || response;
const normalizeList = (response, keys = []) => {
  const payload = unwrapData(response);
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return payload?.items || payload?.results || [];
};
const getEventId = (event) => event?.id || event?._id || event?.event_id;
const getFilmId = (event) =>
  event?.film_id || event?.movie_id || event?.film?.id || event?.movie?.id;
const getRoomId = (event) =>
  event?.room_id || event?.room?.id || event?.rooms?.id;
const getRoomEntityId = (room) => room?.id || room?._id || room?.room_id;
const getStartTime = (event) =>
  event?.start_time ||
  event?.startTime ||
  event?.started_at ||
  event?.show_time ||
  event?.showTime;
const getDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};
const formatDateTab = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const weekdays = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return {
    day: String(date.getDate()).padStart(2, "0"),
    month: String(date.getMonth() + 1).padStart(2, "0"),
    weekday: weekdays[date.getDay()],
  };
};
const formatTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};
const isLateShowtime = (value) => {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getHours() >= 22;
};
const getMovieTitle = (movie) =>
  movie?.title || movie?.name || movie?.film_name || "Phim đang chiếu";
const getMoviePoster = (movie) => movie?.poster_url || movie?.posterUrl;
const getMovieDuration = (movie) =>
  movie?.duration ||
  movie?.duration_minutes ||
  movie?.runtime ||
  movie?.runtime_minutes;
const buildDateOptions = (events, roomId) => {
  const dates = new Map();
  events
    .filter((event) => String(getRoomId(event)) === String(roomId))
    .forEach((event) => {
      const startTime = getStartTime(event);
      const key = getDateKey(startTime);
      if (key && !dates.has(key)) dates.set(key, startTime);
    });
  return [...dates.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(0, 7)
    .map(([key, value]) => ({ key, value }));
};

const TheaterSchedulePage = () => {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [events, setEvents] = useState([]);
  const [movieMap, setMovieMap] = useState({});
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const requestConfig = { skipAuth: true, skipAuthRedirect: true };
      const eventResponse = await eventService.getSchedule(
        { limit: 500 },
        requestConfig,
      );
      const nextEvents = normalizeList(eventResponse, ["events"])
        .filter((event) => isShowtimeVisible(event))
        .sort(
          (left, right) =>
            new Date(getStartTime(left)).getTime() -
            new Date(getStartTime(right)).getTime(),
        );
      const nextRooms = [
        ...new Map(
          nextEvents
            .filter((event) => event?.room)
            .map((event) => [String(getRoomId(event)), event.room]),
        ).values(),
      ];
      const nextMovieMap = Object.fromEntries(
        nextEvents
          .filter((event) => event?.film)
          .map((event) => [String(getFilmId(event)), event.film]),
      );
      const initialRoomId =
        getRoomEntityId(nextRooms[0]) || getRoomId(nextEvents[0]) || "";
      const initialDates = buildDateOptions(nextEvents, initialRoomId);

      setRooms(nextRooms);
      setEvents(nextEvents);
      setMovieMap(nextMovieMap);
      setSelectedRoomId(String(initialRoomId));
      setSelectedDate(initialDates[0]?.key || "");
    } catch (err) {
      setError(getErrorMessage(err, "Không thể tải lịch chiếu theo rạp."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadSchedule();
  }, [loadSchedule]);

  const dateOptions = useMemo(
    () => buildDateOptions(events, selectedRoomId),
    [events, selectedRoomId],
  );
  const selectedEvents = useMemo(
    () =>
      events.filter(
        (event) =>
          String(getRoomId(event)) === String(selectedRoomId) &&
          getDateKey(getStartTime(event)) === selectedDate,
      ),
    [events, selectedDate, selectedRoomId],
  );
  const movieGroups = useMemo(() => {
    const groups = new Map();
    selectedEvents.forEach((event) => {
      const filmId = String(getFilmId(event) || "");
      if (!filmId) return;
      if (!groups.has(filmId)) groups.set(filmId, []);
      groups.get(filmId).push(event);
    });
    return [...groups.entries()];
  }, [selectedEvents]);
  const selectedRoom = rooms.find(
    (room) => String(getRoomEntityId(room)) === String(selectedRoomId),
  );

  const handleRoomChange = (event) => {
    const roomId = event.target.value;
    const nextDates = buildDateOptions(events, roomId);
    setSelectedRoomId(roomId);
    setSelectedDate(nextDates[0]?.key || "");
  };

  const selectShowtime = (event) => {
    navigate(`/booking/${getEventId(event)}?filmId=${getFilmId(event)}`);
  };

  return (
    <main className="theater-schedule-page">
      <header className="schedule-page-header">
        <div>
          <span className="page-kicker">Movie schedule</span>
          <h1>Lịch chiếu theo rạp</h1>
        </div>
        <label className="schedule-room-select">
          <span>Rạp chiếu</span>
          <div>
            <Building2 aria-hidden="true" />
            <select value={selectedRoomId} onChange={handleRoomChange}>
              {rooms.map((room) => (
                <option
                  key={getRoomEntityId(room)}
                  value={getRoomEntityId(room)}
                >
                  {room.name || room.room_name}
                </option>
              ))}
            </select>
          </div>
        </label>
      </header>

      {error && <ErrorState message={error} onRetry={loadSchedule} />}
      {loading ? (
        <LoadingState label="Đang tải lịch chiếu..." />
      ) : (
        <>
          <section className="schedule-date-section">
            <div className="schedule-date-tabs" role="tablist">
              {dateOptions.map(({ key, value }) => {
                const label = formatDateTab(value);
                return (
                  <button
                    className={key === selectedDate ? "active" : ""}
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={key === selectedDate}
                    onClick={() => setSelectedDate(key)}
                  >
                    <strong>{label?.day}</strong>
                    <span>
                      /{label?.month} - {label?.weekday}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="schedule-legend">
              <span>
                <MapPin aria-hidden="true" />
                {selectedRoom?.name || selectedRoom?.room_name || "Rạp QTIK"}
              </span>
            </div>
          </section>

          <section className="schedule-movie-grid">
            {movieGroups.map(([filmId, filmEvents]) => {
              const movie =
                movieMap[filmId] || filmEvents[0]?.film || filmEvents[0]?.movie;
              return (
                <article className="schedule-movie" key={filmId}>
                  <div className="schedule-poster">
                    {getMoviePoster(movie) ? (
                      <img
                        src={getMoviePoster(movie)}
                        alt={getMovieTitle(movie)}
                      />
                    ) : (
                      <Film aria-hidden="true" />
                    )}
                  </div>
                  <div className="schedule-movie-content">
                    <h2>{getMovieTitle(movie)}</h2>
                    <div className="schedule-movie-meta">
                      <span>
                        <Tag aria-hidden="true" />
                        {movie?.genre || "Đang cập nhật"}
                      </span>
                      <span>
                        <Clock3 aria-hidden="true" />
                        {getMovieDuration(movie)
                          ? `${getMovieDuration(movie)} phút`
                          : "Đang cập nhật"}
                      </span>
                    </div>
                    <strong className="schedule-format">2D PHỤ ĐỀ</strong>
                    <div className="schedule-times">
                      {filmEvents.map((event) => {
                        const eventId = getEventId(event);
                        const seatCount = event.available_seats;
                        return (
                          <button
                            className={
                              isLateShowtime(getStartTime(event)) ? "late" : ""
                            }
                            key={eventId}
                            type="button"
                            onClick={() => selectShowtime(event)}
                          >
                            <strong>{formatTime(getStartTime(event))}</strong>
                            <small>
                              {seatCount != null
                                ? `${seatCount} ghế trống`
                                : "Xem ghế"}
                            </small>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </article>
              );
            })}
            {!movieGroups.length && (
              <div className="schedule-empty">
                <CalendarRange aria-hidden="true" />
                <strong>Chưa có lịch chiếu</strong>
                <span>Hãy chọn một rạp hoặc ngày chiếu khác.</span>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
};

export default TheaterSchedulePage;
