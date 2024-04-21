import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./routes/routes";
import * as dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./utility/swagger";
import YAML from "yamljs";

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

// test route
app.get("/test", async (req, res) => {
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

export default app;
