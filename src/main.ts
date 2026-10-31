import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import morgan from "morgan";

async function bootstrap() {
    const app = await NestFactory.create(AppModule, { bufferLogs: true });

    // Allowed frontends: FRONTEND_URL (comma separated) plus localhost in development
    const allowedOrigins = (process.env.FRONTEND_URL ?? "")
        .split(",")
        .map((origin) => origin.trim().replace(/\/$/, ""))
        .filter(Boolean);
    if (process.env.NODE_ENV !== "production") {
        allowedOrigins.push("http://localhost:3000", "http://127.0.0.1:3000");
    } else if (allowedOrigins.length === 0) {
        allowedOrigins.push("https://dzkitab-seven.vercel.app");
    }

    app.enableCors({ origin: allowedOrigins, credentials: true });

    app.setGlobalPrefix("/api");

    const config = new DocumentBuilder()
        .setTitle("DZKitab API")
        .setDescription(
            "RESTful API Documentation of an Algerian book marketplace",
        )
        .setVersion("0.1.0")
        .addCookieAuth("access-token")
        .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup("documentation", app, document);

    app.use(cookieParser());
    app.use(morgan("combined"));
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
        }),
    );
    await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
