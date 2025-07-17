import express, { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./routes/routes";
import * as dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./utility/swagger";
import YAML from "yamljs";
import testRoute from "./test/testRoute";

const swaggerDocument = YAML.load("./src/utility/swagger.yaml");

dotenv.config();

// create app

const app = express();

// use middleware
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// static folder

// Serve images from the 'public/images' directory
// app.use(express.static(path.join(__dirname, '../public')))

// route

app.use("/api/", router);
app.use("/test/:year/:month", testRoute);

// static folder
app.use("/public", express.static("public"));


// test route
app.get("/", async (req, res) => {
  /*  await prisma.user.create({
        data: {
          name: 'Rich',
          email: 'hello@prisma.com',
          posts: {
            create: {
              title: 'My first post',
              body: 'Lots of really interesting stuff',
              slug: 'my-first-post',
            },
          },
        },
      })
    
      const allUsers = await prisma.user.findMany({
        include: {
          posts: true,
        },
      })
      console.dir(allUsers, { depth: null }) */
      return res.json({ success: true, message: "test successful" });
});
// global error handler
app.use((err:ErrorRequestHandler, req:Request, res:Response, next:NextFunction) => {
  console.error(err);
  
 return res.status(500).json({
    success: false,
    errors: [
      {
        type: "server error",
        msg: "Internal server error",
      },
    ],
  });
});
export default app;
