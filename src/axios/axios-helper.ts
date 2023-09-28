import axios from "axios";
import { Logger } from "../logger";

export function ManageAxiosError(error: any) {
  if (axios.isAxiosError(error)) {
    Logger.error(`Axios Error: ${error}`);
    return error.message;
  } else {
    Logger.error(`Axios Error: ${error}`);
    return "An unexpected error occurred";
  }
}
