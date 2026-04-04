import { Fragment, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpenText,
  CalendarDays,
  ChartColumnBig,
  CheckCircle2,
  FolderKanban,
  LayoutDashboard,
  Plus,
  Trash2,
  CheckCircle,
  Circle,
  ChevronRight,
  Book,
  Lightbulb,
  Target,
  ShoppingCart,
  GraduationCap,
  ClipboardList,
  User,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api, getApiErrorMessage } from "../lib/api";
import MobileTabBar from "../components/MobileTabBar";

const navItems = [
  { label: "Today", icon: LayoutDashboard, to: "/dashboard" },
  { label: "Journal", icon: BookOpenText, to: "/journal" },
  { label: "Track", icon: CheckCircle2, to: "/track" },
  { label: "Analytics", icon: ChartColumnBig, to: "/analytics" },
  { label: "Organise", icon: FolderKanban, to: "/organise", active: true },
  { label: "Profile", icon: User, to: "/profile" },
];

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
const HOURS = Array.from({ length: 24 }, (_, i) => i); // 00:00 to 23:00
const HOURS_12 = Array.from({ length: 12 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);
const MINUTES_60 = Array.from({ length: 60 }, (_, i) =>
  String(i).padStart(2, "0"),
);
const BLOCK_COLOR_THEMES = [
  {
    border: "border-pink-500/30",
    background: "bg-pink-500/10",
    hover: "hover:bg-pink-500/20",
    title: "text-pink-300",
    time: "text-pink-100/70",
  },
  {
    border: "border-sky-500/30",
    background: "bg-sky-500/10",
    hover: "hover:bg-sky-500/20",
    title: "text-sky-300",
    time: "text-sky-100/70",
  },
  {
    border: "border-emerald-500/30",
    background: "bg-emerald-500/10",
    hover: "hover:bg-emerald-500/20",
    title: "text-emerald-300",
    time: "text-emerald-100/70",
  },
  {
    border: "border-amber-500/30",
    background: "bg-amber-500/10",
    hover: "hover:bg-amber-500/20",
    title: "text-amber-300",
    time: "text-amber-100/70",
  },
  {
    border: "border-violet-500/30",
    background: "bg-violet-500/10",
    hover: "hover:bg-violet-500/20",
    title: "text-violet-300",
    time: "text-violet-100/70",
  },
  {
    border: "border-cyan-500/30",
    background: "bg-cyan-500/10",
    hover: "hover:bg-cyan-500/20",
    title: "text-cyan-300",
    time: "text-cyan-100/70",
  },
];
const DEFAULT_TIME_INPUT = {
  time: "09:00",
  period: "AM",
};
const MAX_ACTIVITY_DESCRIPTION_LENGTH = 80;
const MAX_PAD_TITLE_LENGTH = 60;
const MAX_PAD_ITEM_LENGTH = 120;
const createDefaultBlockForm = () => ({
  days: ["monday"],
  activity: "",
  start: { ...DEFAULT_TIME_INPUT },
  end: { time: "10:00", period: "AM" },
});

const PAD_ICONS = {
  goals: Target,
  books: Book,
  "to-learn": GraduationCap,
  "to-do": ClipboardList,
  "to-buy": ShoppingCart,
  ideas: Lightbulb,
  custom: FolderKanban,
};

const PAD_THEMES = {
  goals: {
    activeButton:
      "bg-rose-500/20 border-rose-400/50 text-white shadow-[0_16px_40px_-24px_rgba(251,113,133,0.85)]",
    idleButton:
      "bg-rose-500/8 border-rose-400/15 text-rose-100 hover:bg-rose-500/14 hover:border-rose-400/30",
    activeIcon: "bg-rose-400 text-white shadow-lg shadow-rose-500/20",
    idleIcon: "bg-rose-500/12 text-rose-300 border border-rose-400/20",
    chevron: "text-rose-300",
    detailCard:
      "border-rose-400/20 bg-gradient-to-br from-rose-500/12 via-slate-900/70 to-slate-950/95",
    detailIcon: "text-rose-300 bg-rose-500/12 border-rose-400/20",
    actionButton: "bg-rose-500 hover:bg-rose-400",
    itemCard: "border-rose-400/12 bg-rose-500/7 hover:bg-rose-500/12",
    itemDoneCard: "border-rose-400/10 bg-rose-500/5 hover:bg-rose-500/9",
    itemToggle: "text-rose-300 hover:text-rose-200",
    itemTitle: "text-rose-50",
    itemDoneTitle: "text-rose-100/55 decoration-rose-300/30",
    itemDelete: "text-rose-200/55 hover:text-rose-100",
  },
  books: {
    activeButton:
      "bg-amber-500/20 border-amber-400/50 text-white shadow-[0_16px_40px_-24px_rgba(251,191,36,0.85)]",
    idleButton:
      "bg-amber-500/8 border-amber-400/15 text-amber-100 hover:bg-amber-500/14 hover:border-amber-400/30",
    activeIcon: "bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20",
    idleIcon: "bg-amber-500/12 text-amber-300 border border-amber-400/20",
    chevron: "text-amber-300",
    detailCard:
      "border-amber-400/20 bg-gradient-to-br from-amber-500/12 via-slate-900/70 to-slate-950/95",
    detailIcon: "text-amber-300 bg-amber-500/12 border-amber-400/20",
    actionButton: "bg-amber-500 hover:bg-amber-400 text-slate-950",
    itemCard: "border-amber-400/12 bg-amber-500/7 hover:bg-amber-500/12",
    itemDoneCard: "border-amber-400/10 bg-amber-500/5 hover:bg-amber-500/9",
    itemToggle: "text-amber-300 hover:text-amber-200",
    itemTitle: "text-amber-50",
    itemDoneTitle: "text-amber-100/55 decoration-amber-300/30",
    itemDelete: "text-amber-200/55 hover:text-amber-100",
  },
  "to-learn": {
    activeButton:
      "bg-sky-500/20 border-sky-400/50 text-white shadow-[0_16px_40px_-24px_rgba(56,189,248,0.85)]",
    idleButton:
      "bg-sky-500/8 border-sky-400/15 text-sky-100 hover:bg-sky-500/14 hover:border-sky-400/30",
    activeIcon: "bg-sky-400 text-slate-950 shadow-lg shadow-sky-500/20",
    idleIcon: "bg-sky-500/12 text-sky-300 border border-sky-400/20",
    chevron: "text-sky-300",
    detailCard:
      "border-sky-400/20 bg-gradient-to-br from-sky-500/12 via-slate-900/70 to-slate-950/95",
    detailIcon: "text-sky-300 bg-sky-500/12 border-sky-400/20",
    actionButton: "bg-sky-500 hover:bg-sky-400 text-slate-950",
    itemCard: "border-sky-400/12 bg-sky-500/7 hover:bg-sky-500/12",
    itemDoneCard: "border-sky-400/10 bg-sky-500/5 hover:bg-sky-500/9",
    itemToggle: "text-sky-300 hover:text-sky-200",
    itemTitle: "text-sky-50",
    itemDoneTitle: "text-sky-100/55 decoration-sky-300/30",
    itemDelete: "text-sky-200/55 hover:text-sky-100",
  },
  "to-do": {
    activeButton:
      "bg-emerald-500/20 border-emerald-400/50 text-white shadow-[0_16px_40px_-24px_rgba(52,211,153,0.85)]",
    idleButton:
      "bg-emerald-500/8 border-emerald-400/15 text-emerald-100 hover:bg-emerald-500/14 hover:border-emerald-400/30",
    activeIcon: "bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20",
    idleIcon: "bg-emerald-500/12 text-emerald-300 border border-emerald-400/20",
    chevron: "text-emerald-300",
    detailCard:
      "border-emerald-400/20 bg-gradient-to-br from-emerald-500/12 via-slate-900/70 to-slate-950/95",
    detailIcon: "text-emerald-300 bg-emerald-500/12 border-emerald-400/20",
    actionButton: "bg-emerald-500 hover:bg-emerald-400 text-slate-950",
    itemCard: "border-emerald-400/12 bg-emerald-500/7 hover:bg-emerald-500/12",
    itemDoneCard:
      "border-emerald-400/10 bg-emerald-500/5 hover:bg-emerald-500/9",
    itemToggle: "text-emerald-300 hover:text-emerald-200",
    itemTitle: "text-emerald-50",
    itemDoneTitle: "text-emerald-100/55 decoration-emerald-300/30",
    itemDelete: "text-emerald-200/55 hover:text-emerald-100",
  },
  "to-buy": {
    activeButton:
      "bg-fuchsia-500/20 border-fuchsia-400/50 text-white shadow-[0_16px_40px_-24px_rgba(232,121,249,0.85)]",
    idleButton:
      "bg-fuchsia-500/8 border-fuchsia-400/15 text-fuchsia-100 hover:bg-fuchsia-500/14 hover:border-fuchsia-400/30",
    activeIcon: "bg-fuchsia-400 text-white shadow-lg shadow-fuchsia-500/20",
    idleIcon: "bg-fuchsia-500/12 text-fuchsia-300 border border-fuchsia-400/20",
    chevron: "text-fuchsia-300",
    detailCard:
      "border-fuchsia-400/20 bg-gradient-to-br from-fuchsia-500/12 via-slate-900/70 to-slate-950/95",
    detailIcon: "text-fuchsia-300 bg-fuchsia-500/12 border-fuchsia-400/20",
    actionButton: "bg-fuchsia-500 hover:bg-fuchsia-400",
    itemCard: "border-fuchsia-400/12 bg-fuchsia-500/7 hover:bg-fuchsia-500/12",
    itemDoneCard:
      "border-fuchsia-400/10 bg-fuchsia-500/5 hover:bg-fuchsia-500/9",
    itemToggle: "text-fuchsia-300 hover:text-fuchsia-200",
    itemTitle: "text-fuchsia-50",
    itemDoneTitle: "text-fuchsia-100/55 decoration-fuchsia-300/30",
    itemDelete: "text-fuchsia-200/55 hover:text-fuchsia-100",
  },
  ideas: {
    activeButton:
      "bg-violet-500/20 border-violet-400/50 text-white shadow-[0_16px_40px_-24px_rgba(167,139,250,0.85)]",
    idleButton:
      "bg-violet-500/8 border-violet-400/15 text-violet-100 hover:bg-violet-500/14 hover:border-violet-400/30",
    activeIcon: "bg-violet-400 text-white shadow-lg shadow-violet-500/20",
    idleIcon: "bg-violet-500/12 text-violet-300 border border-violet-400/20",
    chevron: "text-violet-300",
    detailCard:
      "border-violet-400/20 bg-gradient-to-br from-violet-500/12 via-slate-900/70 to-slate-950/95",
    detailIcon: "text-violet-300 bg-violet-500/12 border-violet-400/20",
    actionButton: "bg-violet-500 hover:bg-violet-400",
    itemCard: "border-violet-400/12 bg-violet-500/7 hover:bg-violet-500/12",
    itemDoneCard: "border-violet-400/10 bg-violet-500/5 hover:bg-violet-500/9",
    itemToggle: "text-violet-300 hover:text-violet-200",
    itemTitle: "text-violet-50",
    itemDoneTitle: "text-violet-100/55 decoration-violet-300/30",
    itemDelete: "text-violet-200/55 hover:text-violet-100",
  },
};

const CUSTOM_PAD_THEMES = [
  {
    activeButton:
      "bg-cyan-500/20 border-cyan-400/50 text-white shadow-[0_16px_40px_-24px_rgba(34,211,238,0.85)]",
    idleButton:
      "bg-cyan-500/8 border-cyan-400/15 text-cyan-100 hover:bg-cyan-500/14 hover:border-cyan-400/30",
    activeIcon: "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20",
    idleIcon: "bg-cyan-500/12 text-cyan-300 border border-cyan-400/20",
    chevron: "text-cyan-300",
    detailCard:
      "border-cyan-400/20 bg-gradient-to-br from-cyan-500/12 via-slate-900/70 to-slate-950/95",
    detailIcon: "text-cyan-300 bg-cyan-500/12 border-cyan-400/20",
    actionButton: "bg-cyan-500 hover:bg-cyan-400 text-slate-950",
    itemCard: "border-cyan-400/12 bg-cyan-500/7 hover:bg-cyan-500/12",
    itemDoneCard: "border-cyan-400/10 bg-cyan-500/5 hover:bg-cyan-500/9",
    itemToggle: "text-cyan-300 hover:text-cyan-200",
    itemTitle: "text-cyan-50",
    itemDoneTitle: "text-cyan-100/55 decoration-cyan-300/30",
    itemDelete: "text-cyan-200/55 hover:text-cyan-100",
  },
  {
    activeButton:
      "bg-orange-500/20 border-orange-400/50 text-white shadow-[0_16px_40px_-24px_rgba(251,146,60,0.85)]",
    idleButton:
      "bg-orange-500/8 border-orange-400/15 text-orange-100 hover:bg-orange-500/14 hover:border-orange-400/30",
    activeIcon: "bg-orange-400 text-slate-950 shadow-lg shadow-orange-500/20",
    idleIcon: "bg-orange-500/12 text-orange-300 border border-orange-400/20",
    chevron: "text-orange-300",
    detailCard:
      "border-orange-400/20 bg-gradient-to-br from-orange-500/12 via-slate-900/70 to-slate-950/95",
    detailIcon: "text-orange-300 bg-orange-500/12 border-orange-400/20",
    actionButton: "bg-orange-500 hover:bg-orange-400 text-slate-950",
    itemCard: "border-orange-400/12 bg-orange-500/7 hover:bg-orange-500/12",
    itemDoneCard: "border-orange-400/10 bg-orange-500/5 hover:bg-orange-500/9",
    itemToggle: "text-orange-300 hover:text-orange-200",
    itemTitle: "text-orange-50",
    itemDoneTitle: "text-orange-100/55 decoration-orange-300/30",
    itemDelete: "text-orange-200/55 hover:text-orange-100",
  },
  {
    activeButton:
      "bg-lime-500/20 border-lime-400/50 text-white shadow-[0_16px_40px_-24px_rgba(163,230,53,0.85)]",
    idleButton:
      "bg-lime-500/8 border-lime-400/15 text-lime-100 hover:bg-lime-500/14 hover:border-lime-400/30",
    activeIcon: "bg-lime-400 text-slate-950 shadow-lg shadow-lime-500/20",
    idleIcon: "bg-lime-500/12 text-lime-300 border border-lime-400/20",
    chevron: "text-lime-300",
    detailCard:
      "border-lime-400/20 bg-gradient-to-br from-lime-500/12 via-slate-900/70 to-slate-950/95",
    detailIcon: "text-lime-300 bg-lime-500/12 border-lime-400/20",
    actionButton: "bg-lime-500 hover:bg-lime-400 text-slate-950",
    itemCard: "border-lime-400/12 bg-lime-500/7 hover:bg-lime-500/12",
    itemDoneCard: "border-lime-400/10 bg-lime-500/5 hover:bg-lime-500/9",
    itemToggle: "text-lime-300 hover:text-lime-200",
    itemTitle: "text-lime-50",
    itemDoneTitle: "text-lime-100/55 decoration-lime-300/30",
    itemDelete: "text-lime-200/55 hover:text-lime-100",
  },
];

const getPadTheme = (pad, index = 0) => {
  if (PAD_THEMES[pad.padType]) {
    return PAD_THEMES[pad.padType];
  }

  return CUSTOM_PAD_THEMES[index % CUSTOM_PAD_THEMES.length];
};

const toDateInputValue = (value) => {
  if (!value) return "";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "";
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDateRangeError = (startDate, endDate) => {
  if (!startDate || !endDate) return "";
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Enter valid dates.";
  }
  if (start > end) return "Start date must be before end date.";
  return "";
};

export default function OrganisePage() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("timetable");
  const [timetable, setTimetable] = useState({});
  const [pads, setPads] = useState([]);
  const [selectedPad, setSelectedPad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newBlock, setNewBlock] = useState(createDefaultBlockForm);
  const [newPadTitle, setNewPadTitle] = useState("");
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemStartDate, setNewItemStartDate] = useState("");
  const [newItemEndDate, setNewItemEndDate] = useState("");
  const [padTitleDraft, setPadTitleDraft] = useState("");
  const [isDayMenuOpen, setIsDayMenuOpen] = useState(false);
  const [isStartTimeMenuOpen, setIsStartTimeMenuOpen] = useState(false);
  const [isEndTimeMenuOpen, setIsEndTimeMenuOpen] = useState(false);
  const [addingBlock, setAddingBlock] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState(null);
  const [editingBlockGroupId, setEditingBlockGroupId] = useState(null);
  const [savingBlock, setSavingBlock] = useState(false);
  const [clearingTimetable, setClearingTimetable] = useState(false);
  const [addingPad, setAddingPad] = useState(false);
  const [renamingPad, setRenamingPad] = useState(false);
  const [deletingPad, setDeletingPad] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemTitle, setEditingItemTitle] = useState("");
  const [editingItemStartDate, setEditingItemStartDate] = useState("");
  const [editingItemEndDate, setEditingItemEndDate] = useState("");
  const [savingItemId, setSavingItemId] = useState(null);
  const [togglingItemId, setTogglingItemId] = useState(null);
  const [deletingItemId, setDeletingItemId] = useState(null);
  const itemRefs = useRef({});
  const { user } = useAuth();
  const selectedPadIndex = selectedPad
    ? pads.findIndex((pad) => pad._id === selectedPad._id)
    : -1;
  const selectedPadTheme =
    selectedPad && selectedPadIndex >= 0
      ? getPadTheme(selectedPad, selectedPadIndex)
      : null;
  const [startHour = "09", startMinute = "00"] = newBlock.start.time.split(":");
  const [endHour = "10", endMinute = "00"] = newBlock.end.time.split(":");
  const newItemDateError = getDateRangeError(newItemStartDate, newItemEndDate);
  const editingItemDateError = getDateRangeError(
    editingItemStartDate,
    editingItemEndDate,
  );

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setPadTitleDraft(selectedPad?.title || "");
  }, [selectedPad]);

  useEffect(() => {
    const padId = searchParams.get("padId");
    if (!padId || pads.length === 0) return;
    const matchingPad = pads.find((pad) => pad._id === padId);
    if (matchingPad) {
      setActiveTab("pads");
      setSelectedPad(matchingPad);
    }
  }, [pads, searchParams]);

  useEffect(() => {
    const itemId = searchParams.get("itemId");
    if (!itemId || !selectedPad) return;
    const hasItem = selectedPad.items?.some((item) => item._id === itemId);
    if (!hasItem) return;

    requestAnimationFrame(() => {
      const node = itemRefs.current[itemId];
      if (node) {
        node.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }, [selectedPad, searchParams]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: ttJson }, { data: padsJson }] = await Promise.all([
        api.get("/timetable"),
        api.get("/pads"),
      ]);
      setTimetable(ttJson.schedule);
      setPads(padsJson.pads);
    } catch (err) {
      console.error("Fetch failed:", err);
      setError(
        getApiErrorMessage(err, "Failed to connect to the organisation hub."),
      );
    } finally {
      setLoading(false);
    }
  };

  const to24HourTime = ({ time, period }) => {
    const [hourPart = "0", minutePart = "00"] = time.split(":");
    const numericHour = Number(hourPart);
    if (Number.isNaN(numericHour)) return "00:00";

    const normalizedHour =
      period === "AM" ? numericHour % 12 : (numericHour % 12) + 12;

    return `${String(normalizedHour).padStart(2, "0")}:${minutePart}`;
  };

  const from24HourTime = (timeStr) => {
    const [hourPart = "0", minutePart = "00"] = timeStr.split(":");
    const rawHour = Number(hourPart);
    const period = rawHour >= 12 ? "PM" : "AM";
    const hour12 = rawHour % 12 || 12;

    return {
      time: `${String(hour12).padStart(2, "0")}:${minutePart}`,
      period,
    };
  };

  const buildBlockPayload = (blockForm) => ({
    days: blockForm.days,
    activity: blockForm.activity,
    startTime: to24HourTime(blockForm.start),
    endTime: to24HourTime(blockForm.end),
  });

  const formatDisplayTime = (timeStr) => {
    const { time, period } = from24HourTime(timeStr);
    return `${time} ${period}`;
  };

  const formatHourLabel = (hour) => {
    const period = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12} ${period}`;
  };

  const updateBlockTime = (field, key, value) => {
    setNewBlock((current) => ({
      ...current,
      [field]: {
        ...current[field],
        [key]: value,
      },
    }));
  };

  const formatDayLabel = (day) => day.charAt(0).toUpperCase() + day.slice(1);

  const getSelectedDaysLabel = () => {
    if (newBlock.days.length === 0) return "Select days";
    if (newBlock.days.length === 1) return formatDayLabel(newBlock.days[0]);
    return `${newBlock.days.length} days`;
  };

  const toggleBlockDay = (day) => {
    setNewBlock((current) => {
      const hasDay = current.days.includes(day);
      const nextDays = hasDay
        ? current.days.filter((currentDay) => currentDay !== day)
        : [...current.days, day];

      return {
        ...current,
        days: nextDays.length > 0 ? nextDays : current.days,
      };
    });
  };

  const handleAddBlock = async (e) => {
    e.preventDefault();
    const trimmedActivity = newBlock.activity.trim();
    if (newBlock.days.length === 0) {
      setError("Select at least one day.");
      return;
    }
    if (!trimmedActivity) {
      setError("Add an activity description.");
      return;
    }
    if (trimmedActivity.length > MAX_ACTIVITY_DESCRIPTION_LENGTH) {
      setError(
        `Activity description must be ${MAX_ACTIVITY_DESCRIPTION_LENGTH} characters or fewer.`,
      );
      return;
    }
    setAddingBlock(true);
    setError("");
    try {
      const { data } = await api.post(
        "/timetable/blocks",
        buildBlockPayload({ ...newBlock, activity: trimmedActivity }),
      );
      const createdBlocks = data?.blocks || (data?.block ? [data.block] : []);

      if (createdBlocks.length > 0) {
        setTimetable((current) => {
          const next = { ...current };

          createdBlocks.forEach((block) => {
            const dayBlocks = [...(next[block.day] || []), block];
            dayBlocks.sort(
              (a, b) => getTimeRow(a.startTime) - getTimeRow(b.startTime),
            );
            next[block.day] = dayBlocks;
          });

          return next;
        });
      }
      setNewBlock(createDefaultBlockForm());
      setIsDayMenuOpen(false);
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Failed to add timetable block"));
    } finally {
      setAddingBlock(false);
    }
  };

  const startEditingBlock = (block) => {
    const matchingBlocks = Object.values(timetable)
      .flat()
      .filter((entry) =>
        block.groupId
          ? entry.groupId === block.groupId
          : entry._id === block._id,
      );

    setEditingBlockId(block._id);
    setEditingBlockGroupId(block.groupId || null);
    setNewBlock({
      days: matchingBlocks.map((entry) => entry.day),
      activity: block.activity,
      start: from24HourTime(block.startTime),
      end: from24HourTime(block.endTime),
    });
    setError("");
  };

  const cancelEditingBlock = () => {
    setEditingBlockId(null);
    setEditingBlockGroupId(null);
    setNewBlock(createDefaultBlockForm());
    setIsDayMenuOpen(false);
  };

  const handleUpdateBlock = async (e) => {
    e.preventDefault();
    if (!editingBlockId) return;

    const trimmedActivity = newBlock.activity.trim();
    if (!trimmedActivity) {
      setError("Add an activity description.");
      return;
    }
    if (trimmedActivity.length > MAX_ACTIVITY_DESCRIPTION_LENGTH) {
      setError(
        `Activity description must be ${MAX_ACTIVITY_DESCRIPTION_LENGTH} characters or fewer.`,
      );
      return;
    }

    setSavingBlock(true);
    setError("");
    try {
      const { data } = await api.patch(
        `/timetable/blocks/${editingBlockId}`,
        buildBlockPayload({ ...newBlock, activity: trimmedActivity }),
      );
      const updatedBlocks = data?.blocks || (data?.block ? [data.block] : []);
      if (updatedBlocks.length > 0) {
        setTimetable((current) => {
          const next = Object.fromEntries(
            Object.entries(current).map(([day, blocks]) => {
              const filteredBlocks = blocks.filter((block) => {
                if (editingBlockGroupId) {
                  return block.groupId !== editingBlockGroupId;
                }

                return block._id !== editingBlockId;
              });

              return [day, filteredBlocks];
            }),
          );

          updatedBlocks.forEach((block) => {
            const dayBlocks = [...(next[block.day] || []), block];
            dayBlocks.sort(
              (a, b) => getTimeRow(a.startTime) - getTimeRow(b.startTime),
            );
            next[block.day] = dayBlocks;
          });

          return next;
        });
      }
      cancelEditingBlock();
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Failed to update time block"));
    } finally {
      setSavingBlock(false);
    }
  };

  const handleDeleteBlock = async (blockId) => {
    try {
      await api.delete(`/timetable/blocks/${blockId}`);
      setTimetable((current) =>
        Object.fromEntries(
          Object.entries(current).map(([day, blocks]) => [
            day,
            blocks.filter((block) => block._id !== blockId),
          ]),
        ),
      );
      if (editingBlockId === blockId) {
        cancelEditingBlock();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearTimetable = async () => {
    const hasBlocks = Object.values(timetable).some(
      (blocks) => blocks.length > 0,
    );
    if (!hasBlocks || clearingTimetable) return;

    const confirmed = window.confirm(
      "Clear all timetable blocks? This cannot be undone.",
    );
    if (!confirmed) return;

    setClearingTimetable(true);
    setError("");
    try {
      await api.delete("/timetable/blocks");
      setTimetable({});
      cancelEditingBlock();
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Failed to clear timetable."));
    } finally {
      setClearingTimetable(false);
    }
  };

  // Pad Handlers
  const handleToggleItem = async (padId, itemId) => {
    setTogglingItemId(itemId);
    setError("");
    try {
      const { data } = await api.patch(`/pads/${padId}/items/${itemId}/toggle`);

      if (data?.item) {
        setPads((current) =>
          current.map((pad) =>
            pad._id === padId
              ? {
                  ...pad,
                  items: pad.items.map((item) =>
                    item._id === itemId ? { ...item, ...data.item } : item,
                  ),
                }
              : pad,
          ),
        );
        setSelectedPad((current) =>
          current && current._id === padId
            ? {
                ...current,
                items: current.items.map((item) =>
                  item._id === itemId ? { ...item, ...data.item } : item,
                ),
              }
            : current,
        );
      }
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Failed to toggle item."));
    } finally {
      setTogglingItemId(null);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!selectedPad?._id) return;

    const trimmedTitle = newItemTitle.trim();
    if (!trimmedTitle) return;
    if (trimmedTitle.length > MAX_PAD_ITEM_LENGTH) {
      setError(
        `Item title must be ${MAX_PAD_ITEM_LENGTH} characters or fewer.`,
      );
      return;
    }

    setAddingItem(true);
    setError("");
    try {
      const { data } = await api.post(`/pads/${selectedPad._id}/items`, {
        title: trimmedTitle,
        startDate: newItemStartDate || null,
        endDate: newItemEndDate || null,
      });

      if (data?.item) {
        setPads((current) =>
          current.map((pad) =>
            pad._id === selectedPad._id
              ? { ...pad, items: [...pad.items, data.item] }
              : pad,
          ),
        );
        setSelectedPad((current) =>
          current
            ? { ...current, items: [...current.items, data.item] }
            : current,
        );
      }

      setNewItemTitle("");
      setNewItemStartDate("");
      setNewItemEndDate("");
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Failed to add item."));
    } finally {
      setAddingItem(false);
    }
  };

  const handleDeleteItem = async (padId, itemId) => {
    setDeletingItemId(itemId);
    setError("");
    try {
      await api.delete(`/pads/${padId}/items/${itemId}`);
      setPads((current) =>
        current.map((pad) =>
          pad._id === padId
            ? {
                ...pad,
                items: pad.items.filter((item) => item._id !== itemId),
              }
            : pad,
        ),
      );
      setSelectedPad((current) =>
        current && current._id === padId
          ? {
              ...current,
              items: current.items.filter((item) => item._id !== itemId),
            }
          : current,
      );
      if (editingItemId === itemId) {
        cancelEditingItem();
      }
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Failed to delete item."));
    } finally {
      setDeletingItemId(null);
    }
  };

  const startEditingItem = (item) => {
    setEditingItemId(item._id);
    setEditingItemTitle(item.title);
    setEditingItemStartDate(toDateInputValue(item.startDate));
    setEditingItemEndDate(toDateInputValue(item.endDate));
    setError("");
  };

  const cancelEditingItem = () => {
    setEditingItemId(null);
    setEditingItemTitle("");
    setEditingItemStartDate("");
    setEditingItemEndDate("");
  };

  const handleRenameItem = async (padId, itemId) => {
    const trimmedTitle = editingItemTitle.trim();
    if (!trimmedTitle) return;
    if (trimmedTitle.length > MAX_PAD_ITEM_LENGTH) {
      setError(
        `Item title must be ${MAX_PAD_ITEM_LENGTH} characters or fewer.`,
      );
      return;
    }

    setSavingItemId(itemId);
    setError("");
    try {
      const { data } = await api.patch(`/pads/${padId}/items/${itemId}`, {
        title: trimmedTitle,
        startDate: editingItemStartDate || null,
        endDate: editingItemEndDate || null,
      });

      if (data?.item) {
        setPads((current) =>
          current.map((pad) =>
            pad._id === padId
              ? {
                  ...pad,
                  items: pad.items.map((item) =>
                    item._id === itemId ? { ...item, ...data.item } : item,
                  ),
                }
              : pad,
          ),
        );
        setSelectedPad((current) =>
          current && current._id === padId
            ? {
                ...current,
                items: current.items.map((item) =>
                  item._id === itemId ? { ...item, ...data.item } : item,
                ),
              }
            : current,
        );
      }

      cancelEditingItem();
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Failed to update item."));
    } finally {
      setSavingItemId(null);
    }
  };

  const handleAddPad = async (e) => {
    e.preventDefault();
    const trimmedTitle = newPadTitle.trim();
    if (!trimmedTitle) return;
    if (trimmedTitle.length > MAX_PAD_TITLE_LENGTH) {
      setError(
        `Pad title must be ${MAX_PAD_TITLE_LENGTH} characters or fewer.`,
      );
      return;
    }

    setAddingPad(true);
    setError("");
    try {
      const { data } = await api.post("/pads", { title: trimmedTitle });
      if (data?.pad) {
        setPads((current) => [...current, data.pad]);
        setSelectedPad(data.pad);
      }
      setNewPadTitle("");
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Failed to create pad."));
    } finally {
      setAddingPad(false);
    }
  };

  const handleRenamePad = async (e) => {
    e.preventDefault();
    if (!selectedPad?._id) return;

    const trimmedTitle = padTitleDraft.trim();
    if (!trimmedTitle) return;
    if (trimmedTitle.length > MAX_PAD_TITLE_LENGTH) {
      setError(
        `Pad title must be ${MAX_PAD_TITLE_LENGTH} characters or fewer.`,
      );
      return;
    }

    setRenamingPad(true);
    setError("");
    try {
      const { data } = await api.patch(`/pads/${selectedPad._id}`, {
        title: trimmedTitle,
      });

      if (data?.pad) {
        setPads((current) =>
          current.map((pad) => (pad._id === data.pad._id ? data.pad : pad)),
        );
        setSelectedPad((current) =>
          current?._id === data.pad._id ? { ...current, ...data.pad } : current,
        );
        setPadTitleDraft(data.pad.title);
      }
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Failed to rename pad."));
    } finally {
      setRenamingPad(false);
    }
  };

  const handleDeletePad = async () => {
    if (!selectedPad?._id) return;

    const confirmed = window.confirm(
      `Delete "${selectedPad.title || "this pad"}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingPad(true);
    setError("");
    try {
      await api.delete(`/pads/${selectedPad._id}`);
      setPads((current) =>
        current.filter((pad) => pad._id !== selectedPad._id),
      );
      setSelectedPad(null);
      setPadTitleDraft("");
      setNewItemTitle("");
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Failed to delete pad."));
    } finally {
      setDeletingPad(false);
    }
  };

  const getTimeRow = (timeStr) => {
    const [h, m] = timeStr.split(":").map(Number);
    return Math.max(1, h * 2 + (m >= 30 ? 2 : 1));
  };

  const getDayBlocks = (day) => timetable[day] || [];

  const hasTimetableBlocks = Object.values(timetable).some(
    (blocks) => blocks.length > 0,
  );

  const getBlockSignature = (block) =>
    block.groupId || `${block.activity}|${block.startTime}|${block.endTime}`;

  const buildSignatureGraph = () => {
    const adjacency = new Map();

    const register = (signature) => {
      if (!adjacency.has(signature)) {
        adjacency.set(signature, new Set());
      }
    };

    DAYS.forEach((day) => {
      const daySignatures = Array.from(
        new Set(getDayBlocks(day).map(getBlockSignature)),
      );

      daySignatures.forEach(register);

      for (let i = 0; i < daySignatures.length; i += 1) {
        for (let j = i + 1; j < daySignatures.length; j += 1) {
          const left = daySignatures[i];
          const right = daySignatures[j];
          adjacency.get(left).add(right);
          adjacency.get(right).add(left);
        }
      }
    });

    return adjacency;
  };

  const getSignatureThemeMap = () => {
    const adjacency = buildSignatureGraph();
    const signatures = Array.from(adjacency.keys()).sort();
    const assignedIndexes = new Map();

    signatures.forEach((signature) => {
      const usedIndexes = new Set();
      adjacency.get(signature)?.forEach((neighbor) => {
        if (assignedIndexes.has(neighbor)) {
          usedIndexes.add(assignedIndexes.get(neighbor));
        }
      });

      let candidateIndex = 0;
      while (
        candidateIndex < BLOCK_COLOR_THEMES.length &&
        usedIndexes.has(candidateIndex)
      ) {
        candidateIndex += 1;
      }

      const finalIndex =
        candidateIndex < BLOCK_COLOR_THEMES.length
          ? candidateIndex
          : signature.length % BLOCK_COLOR_THEMES.length;

      assignedIndexes.set(signature, finalIndex);
    });

    const themeMap = new Map();

    assignedIndexes.forEach((index, signature) => {
      themeMap.set(signature, BLOCK_COLOR_THEMES[index]);
    });

    return themeMap;
  };

  const signatureThemes = getSignatureThemeMap();

  const renderPadDetailCard = (pad, theme) => {
    if (!pad) return null;

    return (
      <Card
        className={`${theme?.detailCard || "border-white/10 bg-slate-900/50"} backdrop-blur-xl`}
      >
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle className="text-2xl text-white">{pad.title}</CardTitle>
            <CardDescription>{pad.items.length} items logged</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl border ${theme?.detailIcon || "bg-white/5 border-white/10 text-white"}`}
            >
              {(() => {
                const Icon = PAD_ICONS[pad.padType] || FolderKanban;
                return <Icon className="w-5 h-5" />;
              })()}
            </div>
            <Button
              type="button"
              onClick={handleDeletePad}
              disabled={deletingPad}
              className="h-10 border border-rose-500/20 bg-rose-600/15 px-4 text-rose-300 hover:bg-rose-600/25"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {deletingPad ? "Deleting..." : "Delete Pad"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleAddItem} className="flex gap-2">
            <Input
              placeholder="Add a new entry..."
              className="h-12 border-white/10 bg-black/20 text-white"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              disabled={addingItem}
              maxLength={MAX_PAD_ITEM_LENGTH}
            />
            <Button
              type="submit"
              disabled={
                addingItem || !newItemTitle.trim() || Boolean(newItemDateError)
              }
              className={`${theme?.actionButton || "bg-pink-600 hover:bg-pink-500 text-white"} h-12 px-6`}
            >
              <Plus className="h-5 w-5" />
              <span className="ml-2">{addingItem ? "Adding..." : "Add"}</span>
            </Button>
          </form>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Start date
              </Label>
              <Input
                type="date"
                value={newItemStartDate}
                onChange={(e) => setNewItemStartDate(e.target.value)}
                disabled={addingItem}
                className="h-11 border-white/10 bg-black/20 text-white"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-[0.2em] text-slate-500">
                End date
              </Label>
              <Input
                type="date"
                value={newItemEndDate}
                onChange={(e) => setNewItemEndDate(e.target.value)}
                disabled={addingItem}
                className="h-11 border-white/10 bg-black/20 text-white"
              />
            </div>
          </div>
          {newItemDateError ? (
            <p className="text-xs text-rose-300">{newItemDateError}</p>
          ) : null}

          <div className="space-y-2">
            <div className="hidden grid-cols-[1fr_120px_120px] gap-3 px-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 sm:grid">
              <span>Item</span>
              <span>Start</span>
              <span>End</span>
            </div>
            {pad.items
              .slice()
              .reverse()
              .map((item) => (
                <div
                  key={item._id}
                  id={`pad-item-${item._id}`}
                  ref={(node) => {
                    if (node) itemRefs.current[item._id] = node;
                  }}
                  className={`group flex items-center gap-4 rounded-xl border p-4 transition-all ${
                    item.done
                      ? theme?.itemDoneCard ||
                        "border-white/5 bg-white/[0.02] hover:bg-white/[0.04]"
                      : theme?.itemCard ||
                        "border-white/5 bg-white/[0.03] hover:bg-white/[0.06]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleItem(pad._id, item._id)}
                    disabled={togglingItemId === item._id}
                    className={`shrink-0 transition-colors ${
                      item.done
                        ? theme?.itemToggle || "text-emerald-400"
                        : theme?.itemToggle ||
                          "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {item.done ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>
                  {editingItemId === item._id ? (
                    <div className="flex flex-1 flex-col gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          value={editingItemTitle}
                          onChange={(e) => setEditingItemTitle(e.target.value)}
                          disabled={savingItemId === item._id}
                          className="h-10 border-white/10 bg-black/20 text-white"
                          maxLength={MAX_PAD_ITEM_LENGTH}
                        />
                        <Button
                          type="button"
                          onClick={() => handleRenameItem(pad._id, item._id)}
                          disabled={
                            savingItemId === item._id ||
                            !editingItemTitle.trim() ||
                            Boolean(editingItemDateError)
                          }
                          className="h-10 bg-white/10 px-4 text-white hover:bg-white/15"
                        >
                          {savingItemId === item._id ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          type="button"
                          onClick={cancelEditingItem}
                          disabled={savingItemId === item._id}
                          className="h-10 border border-white/10 bg-transparent px-4 text-slate-300 hover:bg-white/5"
                        >
                          Cancel
                        </Button>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs uppercase tracking-[0.2em] text-slate-500">
                            Start date
                          </Label>
                          <Input
                            type="date"
                            value={editingItemStartDate}
                            onChange={(e) =>
                              setEditingItemStartDate(e.target.value)
                            }
                            disabled={savingItemId === item._id}
                            className="h-10 border-white/10 bg-black/20 text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs uppercase tracking-[0.2em] text-slate-500">
                            End date
                          </Label>
                          <Input
                            type="date"
                            value={editingItemEndDate}
                            onChange={(e) =>
                              setEditingItemEndDate(e.target.value)
                            }
                            disabled={savingItemId === item._id}
                            className="h-10 border-white/10 bg-black/20 text-white"
                          />
                        </div>
                      </div>
                      {editingItemDateError ? (
                        <p className="text-xs text-rose-300">
                          {editingItemDateError}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEditingItem(item)}
                      className={`flex-1 text-left text-sm ${
                        item.done
                          ? theme?.itemDoneTitle ||
                            "text-slate-500 line-through decoration-emerald-500/30"
                          : theme?.itemTitle || "text-slate-200"
                      } ${item.done ? "line-through" : ""}`}
                    >
                      <div className="flex flex-col gap-1 sm:grid sm:grid-cols-[1fr_120px_120px] sm:items-center sm:gap-3">
                        <span>{item.title}</span>
                        <span className="text-xs text-slate-500">
                          {item.startDate
                            ? toDateInputValue(item.startDate)
                            : "--"}
                        </span>
                        <span className="text-xs text-slate-500">
                          {item.endDate ? toDateInputValue(item.endDate) : "--"}
                        </span>
                      </div>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteItem(pad._id, item._id)}
                    disabled={deletingItemId === item._id}
                    className={`p-2 opacity-0 transition-all disabled:opacity-100 group-hover:opacity-100 ${
                      theme?.itemDelete || "text-slate-600 hover:text-rose-400"
                    }`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white font-mono text-sm tracking-[0.3em] uppercase animate-pulse">
        Initialising Organisation Hub...
      </div>
    );

  return (
    <div className="h-screen bg-slate-950 text-slate-100 overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-600/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/5 blur-[120px] rounded-full" />
      </div>
      <main className="relative z-10 h-full overflow-y-auto p-4 pb-28 sm:p-6 sm:pb-32 lg:p-8 lg:pb-8">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
              Structure your life.
            </h1>
            <p className="text-slate-400">
              Your weekly layout and structured notes in one unified hub.
            </p>
          </header>

          {error && (
            <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          )}

          <div className="flex gap-1 p-1 bg-white/5 rounded-2xl border border-white/5 w-fit mb-8">
            {["timetable", "pads"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-xl text-sm font-bold uppercase tracking-widest transition-all ${
                  activeTab === tab
                    ? "bg-pink-600 text-white shadow-lg shadow-pink-900/30"
                    : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "timetable" ? (
              <motion.div
                key="timetable"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                {/* Add Block Quick Entry */}
                <Card className="relative z-30 overflow-visible border-white/5 bg-white/[0.02] backdrop-blur-xl">
                  <form
                    onSubmit={
                      editingBlockId ? handleUpdateBlock : handleAddBlock
                    }
                    className="p-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_140px_minmax(0,1.4fr)_auto] items-end"
                  >
                    <div className="space-y-2 md:col-span-1 lg:col-span-1 md:p-3 md:rounded-lg md:bg-white/5 md:border md:border-white/10">
                      <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest px-1">
                        Activity Description
                      </label>
                      <Input
                        placeholder="Deep work, Gym, Study..."
                        className="bg-black/20 border-white/10 text-white truncate"
                        value={newBlock.activity}
                        onChange={(e) =>
                          setNewBlock({ ...newBlock, activity: e.target.value })
                        }
                        maxLength={MAX_ACTIVITY_DESCRIPTION_LENGTH}
                      />
                    </div>
                    <div className="space-y-2 relative md:col-span-1 lg:col-span-1">
                      <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest px-1">
                        Day
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsDayMenuOpen((current) => !current)}
                        className="flex h-10 sm:h-11 w-full sm:max-w-[120px] md:max-w-[160px] items-center justify-between rounded-lg sm:rounded-xl border border-white/10 bg-slate-900/70 px-2 sm:px-3 text-left text-xs sm:text-sm text-white transition-all hover:border-pink-500/40 hover:bg-slate-900"
                      >
                        <div className="min-w-0">
                          <div className="truncate font-semibold">
                            {getSelectedDaysLabel()}
                          </div>
                          <div className="text-[8px] sm:text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.2em] text-slate-500">
                            {editingBlockId ? "Edit" : "Pick"}
                          </div>
                        </div>
                        <ChevronRight
                          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${isDayMenuOpen ? "rotate-90 text-pink-300" : ""}`}
                        />
                      </button>
                      {isDayMenuOpen && (
                        <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-2xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-xl">
                          <div className="mb-3 flex items-center justify-between px-1">
                            <div>
                              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                                Select Days
                              </div>
                              <div className="text-[10px] text-slate-500">
                                {editingBlockId
                                  ? "Update this time block across one or more days."
                                  : "Add this block to one or more days."}
                              </div>
                            </div>
                            <span className="rounded-full border border-pink-500/20 bg-pink-500/10 px-2 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-pink-200">
                              {newBlock.days.length}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {DAYS.map((day) => {
                              const checked = newBlock.days.includes(day);
                              return (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() => toggleBlockDay(day)}
                                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-all ${
                                    checked
                                      ? "border-pink-500/30 bg-pink-500/10 text-pink-100"
                                      : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.05]"
                                  }`}
                                >
                                  {checked ? (
                                    <CheckCircle className="h-4 w-4 shrink-0 text-pink-300" />
                                  ) : (
                                    <Circle className="h-4 w-4 shrink-0 text-slate-600" />
                                  )}
                                  <span className="truncate">
                                    {formatDayLabel(day)}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:col-span-2 lg:col-span-1">
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                          Start
                        </label>
                        <div className="relative flex flex-col rounded-md border border-white/10 bg-black/20">
                          <button
                            type="button"
                            onClick={() =>
                              setIsStartTimeMenuOpen((current) => !current)
                            }
                            className="px-3 py-2 text-sm text-white bg-slate-950/80 focus:outline-none focus:ring-1 focus:ring-pink-500/50 rounded-none h-10 text-left"
                          >
                            Select time
                          </button>
                          {isStartTimeMenuOpen && (
                            <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-2xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-xl">
                              <div className="mb-3 flex items-center justify-between px-1">
                                <div>
                                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                                    Start Time
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    Choose hour and minute.
                                  </div>
                                </div>
                                <span className="rounded-full border border-pink-500/20 bg-pink-500/10 px-2 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-pink-200">
                                  {newBlock.start.time}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <select
                                  className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-pink-500/50"
                                  value={startHour}
                                  onChange={(e) =>
                                    updateBlockTime(
                                      "start",
                                      "time",
                                      `${e.target.value}:${startMinute}`,
                                    )
                                  }
                                >
                                  {HOURS_12.map((hour) => (
                                    <option key={hour} value={hour}>
                                      {hour}
                                    </option>
                                  ))}
                                </select>
                                <select
                                  className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-pink-500/50"
                                  value={startMinute}
                                  onChange={(e) =>
                                    updateBlockTime(
                                      "start",
                                      "time",
                                      `${startHour}:${e.target.value}`,
                                    )
                                  }
                                >
                                  {MINUTES_60.map((minute) => (
                                    <option key={minute} value={minute}>
                                      {minute}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="mt-3">
                                <select
                                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-pink-500/50"
                                  value={newBlock.start.period}
                                  onChange={(e) =>
                                    updateBlockTime(
                                      "start",
                                      "period",
                                      e.target.value,
                                    )
                                  }
                                >
                                  <option value="AM">AM</option>
                                  <option value="PM">PM</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                          End
                        </label>
                        <div className="relative flex flex-col rounded-md border border-white/10 bg-black/20">
                          <button
                            type="button"
                            onClick={() =>
                              setIsEndTimeMenuOpen((current) => !current)
                            }
                            className="px-3 py-2 text-sm text-white bg-slate-950/80 focus:outline-none focus:ring-1 focus:ring-pink-500/50 rounded-none h-10 text-left"
                          >
                            Select time
                          </button>
                          {isEndTimeMenuOpen && (
                            <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-2xl border border-white/10 bg-slate-950/95 p-3 shadow-2xl backdrop-blur-xl">
                              <div className="mb-3 flex items-center justify-between px-1">
                                <div>
                                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
                                    End Time
                                  </div>
                                  <div className="text-[10px] text-slate-500">
                                    Choose hour and minute.
                                  </div>
                                </div>
                                <span className="rounded-full border border-pink-500/20 bg-pink-500/10 px-2 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-pink-200">
                                  {newBlock.end.time}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <select
                                  className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-pink-500/50"
                                  value={endHour}
                                  onChange={(e) =>
                                    updateBlockTime(
                                      "end",
                                      "time",
                                      `${e.target.value}:${endMinute}`,
                                    )
                                  }
                                >
                                  {HOURS_12.map((hour) => (
                                    <option key={hour} value={hour}>
                                      {hour}
                                    </option>
                                  ))}
                                </select>
                                <select
                                  className="rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-pink-500/50"
                                  value={endMinute}
                                  onChange={(e) =>
                                    updateBlockTime(
                                      "end",
                                      "time",
                                      `${endHour}:${e.target.value}`,
                                    )
                                  }
                                >
                                  {MINUTES_60.map((minute) => (
                                    <option key={minute} value={minute}>
                                      {minute}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="mt-3">
                                <select
                                  className="w-full rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-pink-500/50"
                                  value={newBlock.end.period}
                                  onChange={(e) =>
                                    updateBlockTime(
                                      "end",
                                      "period",
                                      e.target.value,
                                    )
                                  }
                                >
                                  <option value="AM">AM</option>
                                  <option value="PM">PM</option>
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 md:col-span-2 lg:col-span-1">
                      <Button
                        type="submit"
                        disabled={addingBlock || savingBlock}
                        className="bg-pink-600 hover:bg-pink-500 text-white font-bold h-10"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {editingBlockId
                          ? savingBlock
                            ? "Saving..."
                            : "Save"
                          : addingBlock
                            ? "Adding..."
                            : "Add"}
                      </Button>
                      {editingBlockId && (
                        <Button
                          type="button"
                          onClick={cancelEditingBlock}
                          disabled={savingBlock}
                          className="h-10 border border-white/10 bg-transparent text-slate-300 hover:bg-white/5"
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        type="button"
                        onClick={handleClearTimetable}
                        disabled={clearingTimetable || !hasTimetableBlocks}
                        className="h-10 border border-rose-500/30 bg-rose-500/10 text-rose-200 hover:bg-rose-500/20"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        {clearingTimetable ? "Clearing..." : "Clear all"}
                      </Button>
                    </div>
                  </form>
                </Card>

                {/* Timetable Slots (Only Created Blocks) */}
                <div className="relative z-0 rounded-[32px] border border-white/10 bg-slate-900/40 p-4 backdrop-blur-3xl shadow-2xl">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
                    {DAYS.map((day) => {
                      const dayBlocks = getDayBlocks(day);

                      return (
                        <div
                          key={day}
                          className="rounded-2xl border border-white/10 bg-white/[0.02]"
                        >
                          <div className="flex items-center justify-center border-b border-white/10 bg-white/5 px-3 py-2 text-[10px] font-mono uppercase tracking-[0.2em] text-slate-300">
                            {day}
                          </div>
                          <div className="space-y-3 p-3">
                            {dayBlocks.length === 0 ? (
                              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600">
                                No slots
                              </p>
                            ) : (
                              dayBlocks.map((block) => {
                                const signature = getBlockSignature(block);
                                const colorTheme =
                                  signatureThemes.get(signature) ||
                                  BLOCK_COLOR_THEMES[0];
                                const isEditing = editingBlockId === block._id;

                                return (
                                  <motion.div
                                    key={block._id}
                                    initial={{ opacity: 0, y: 6 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onClick={() => startEditingBlock(block)}
                                    className={`relative rounded-xl border p-3 transition-all cursor-pointer group ${colorTheme.border} ${colorTheme.background} ${colorTheme.hover}`}
                                  >
                                    <span
                                      className={`text-[11px] font-bold ${colorTheme.title}`}
                                    >
                                      {block.activity}
                                    </span>
                                    <span
                                      className={`mt-1 block text-[9px] font-mono uppercase ${colorTheme.time}`}
                                    >
                                      {formatDisplayTime(block.startTime)} -
                                      {formatDisplayTime(block.endTime)}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        handleDeleteBlock(block._id);
                                      }}
                                      className={`absolute right-2 top-2 p-1 rounded-md bg-black/40 text-slate-400 transition-opacity hover:text-rose-400 focus-visible:text-rose-300 focus-visible:opacity-100 ${
                                        isEditing
                                          ? "opacity-100"
                                          : "opacity-0 group-hover:opacity-100"
                                      }`}
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </motion.div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="pads"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8"
              >
                {/* Pads List */}
                <div className="space-y-4">
                  <Card className="border-white/10 bg-slate-900/50 backdrop-blur-xl">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">
                        Custom Pad
                      </CardTitle>
                      <CardDescription>
                        Capture ideas, tasks, and lists in a dedicated space.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleAddPad} className="flex gap-2">
                        <Input
                          placeholder="New pad title..."
                          value={newPadTitle}
                          onChange={(e) => setNewPadTitle(e.target.value)}
                          disabled={addingPad}
                          className="bg-black/20 border-white/10 text-white h-11"
                          maxLength={MAX_PAD_TITLE_LENGTH}
                        />
                        <Button
                          type="submit"
                          disabled={addingPad}
                          className="bg-pink-600 hover:bg-pink-500 text-white h-11 px-4"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          {addingPad ? "Adding..." : "Add"}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  {pads.map((pad, index) => {
                    const Icon = PAD_ICONS[pad.padType] || FolderKanban;
                    const isActive = selectedPad?._id === pad._id;
                    const theme = getPadTheme(pad, index);
                    return (
                      <Fragment key={pad._id}>
                        <button
                          onClick={() => setSelectedPad(isActive ? null : pad)}
                          className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all text-left ${
                            isActive ? theme.activeButton : theme.idleButton
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg ${isActive ? theme.activeIcon : theme.idleIcon}`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-sm">
                              {pad.title}
                            </span>
                          </div>
                          <ChevronRight
                            className={`w-4 h-4 transition-transform ${isActive ? `rotate-90 ${theme.chevron}` : "text-slate-600"}`}
                          />
                        </button>
                        {isActive && (
                          <div className="lg:hidden">
                            {renderPadDetailCard(pad, theme)}
                          </div>
                        )}
                      </Fragment>
                    );
                  })}
                </div>

                {/* Pad Items View */}
                <div className="hidden min-h-[600px] lg:block">
                  <AnimatePresence mode="wait">
                    {selectedPad ? (
                      <motion.div
                        key={selectedPad._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        {renderPadDetailCard(selectedPad, selectedPadTheme)}
                      </motion.div>
                    ) : (
                      <div className="h-full flex items-center justify-center border-2 border-dashed border-white/5 rounded-[40px]">
                        <div className="text-center space-y-2">
                          <FolderKanban className="w-12 h-12 text-slate-800 mx-auto" />
                          <p className="text-slate-500 font-mono text-[10px] uppercase tracking-[0.4em]">
                            Select a pad from the left
                          </p>
                        </div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <MobileTabBar items={navItems} />
    </div>
  );
}
