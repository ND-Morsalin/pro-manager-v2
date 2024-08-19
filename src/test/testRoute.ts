import { Request, Response } from "express";
import prisma from "../utility/prisma";
import { Aggregate } from "@prisma/client/runtime/library";
import { create } from "axios";

const testRoute = async (req: Request, res: Response) => {
    const report = await prisma.cash.aggregateRaw({
        pipeline: [
          // Project the required fields along with all other fields you want to include
          { 
            $project: { 
              year: { $year: "$updatedAt" }, 
              month: { $month: "$updatedAt" }, 
              week: { $week: "$updatedAt" }, 
              day: { $dayOfMonth: "$updatedAt" },
              allData: "$$ROOT" // Project all fields in the document for full day data
            } 
          },
          // Group by year
          { 
            $group: { 
              _id: "$year", 
              months: { 
                $push: { 
                  month: "$month", 
                  week: "$week", 
                  day: "$day", 
                  data: "$allData" 
                } 
              } 
            } 
          },
          // Sort years in descending order
          { $sort: { _id: -1 } },
          // Unwind months array to process each month individually
          { $unwind: "$months" },
          // Group by month within each year
          { 
            $group: { 
              _id: { year: "$_id", month: "$months.month" }, 
              weeks: { 
                $push: { 
                  week: "$months.week", 
                  day: "$months.day", 
                  data: "$months.data" 
                } 
              } 
            } 
          },
          // Sort months within each year
          { $sort: { "_id.year": -1, "_id.month": -1 } },
          // Unwind weeks array to process each week individually
          { $unwind: "$weeks" },
          // Group by week within each month
          { 
            $group: { 
              _id: { year: "$_id.year", month: "$_id.month", week: "$weeks.week" }, 
              days: { 
                $push: { 
                  day: "$weeks.day", 
                  data: "$weeks.data" 
                } 
              } 
            } 
          },
          // Sort weeks within each month
          { $sort: { "_id.year": -1, "_id.month": -1, "_id.week": -1 } },
          // Project the final result
          {
            $project: {
              year: "$_id.year",
              month: "$_id.month",
              week: "$_id.week",
              days: "$days"
            }
          }
        ],
      });
      
  console.log(report);
  return res.json({ success: true, message: "test successful", report });
};

export default testRoute;
