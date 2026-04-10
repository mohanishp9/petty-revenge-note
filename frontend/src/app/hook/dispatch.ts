import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/store/store";

// typed dispatch
export const useAppDispatch = () => useDispatch<AppDispatch>();