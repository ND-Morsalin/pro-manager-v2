import { Router } from "express";
import {
  createNote,
  deleteAllNotes,
  deleteMeanyNotesByGivenId,
  getCompletedNotes,
  getNotes,
  getSingleNote,
  getUncompletedNotes,
  updateNote,
  deleteNote,
} from "./noteController";
import checkValidUser from "../../middleware/checkValidUser";

const router = Router();

router.post("/", checkValidUser, createNote);
router.get("/", checkValidUser, getNotes);
router.get("/:id", checkValidUser, getSingleNote);
router.put("/:id", checkValidUser, updateNote);
router.patch("/complete-many", checkValidUser, updateNote);
router.delete("/:id", checkValidUser, deleteNote);
router.get("/uncompleted", checkValidUser, getUncompletedNotes);
router.get("/completed", checkValidUser, getCompletedNotes);
router.delete("/delete-many", checkValidUser, deleteMeanyNotesByGivenId);
router.delete("/delete-all", checkValidUser, deleteAllNotes);

export default router;
