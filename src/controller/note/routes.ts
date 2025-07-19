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
  completeInCompleteManyNotes,
} from "./noteController";
import checkValidUser from "../../middleware/checkValidUser";

const router = Router();

router.post("/", checkValidUser, createNote);
router.get("/", checkValidUser, getNotes);
router.get("/:id", checkValidUser, getSingleNote);
router.put("/:id", checkValidUser, updateNote);
router.delete("/:id", checkValidUser, deleteNote);
router.patch("/all/complete-many", checkValidUser, completeInCompleteManyNotes);
router.get("/all/uncompleted", checkValidUser, getUncompletedNotes);
router.get("/all/completed", checkValidUser, getCompletedNotes);
router.delete("/all/delete-many", checkValidUser, deleteMeanyNotesByGivenId);
router.delete("/all/delete-all", checkValidUser, deleteAllNotes);

export default router;
