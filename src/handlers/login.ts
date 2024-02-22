import { Request, Response } from "express"
import { invalidBody, unknownServerError } from "./common.js"
import { db } from "../context.js";
import { User } from "../types.js";

export async function loginForm(req: Request, res: Response): Promise<void> {
    let isRetrying: boolean = (req as any).id === "true";

    if (req.cookies.auth === "true") {
        if (req.cookies.root === "true") {
            res.redirect('/superuser');
        } else {
            res.redirect('/dashboard');
        }
        return;
    }

    res.send(`
    <!DOCTYPE html>
    <html>
        <head>
            <meta charset="utf-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <title></title>
            <meta name="description" content="">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <link rel="stylesheet" href="../login.css" type="text/css">
        </head>
        <body>
            <form action="/" method="post">
                <h2>HISTORIFY</h2>
                <div>${isRetrying ? "failed login" : ""}</div>
                <div class="input--container">
                    <label for="user">USERNAME:</label>
                    <input type="text" id="user" name="username"/>
                </div>
                <div class="input--container">
                    <label for="password">PASSWORD:</label>
                    <input type="password" id="password" name="password"/>
                </div>
                <input class="submit--btn" type="submit" value="Enviar">
            </form>
        </body>
    </html>
    `);
}

export async function logOut(_: Request, res: Response): Promise<void> {
    res.clearCookie('root');
    res.clearCookie('auth');
    res.redirect('/');
}

export async function logUser(req: Request, res: Response): Promise<void> {
    if (!isValidLogObject(req.body)) return invalidBody(res);

    let user: User;
    try {
        user = await db.selectFrom("users")
            .selectAll()
            .where("username", "=", req.body.username)
            .executeTakeFirstOrThrow();
    } catch (err) {
        console.log(err);
        return unknownServerError(res, err);
    }

    if (req.body.password === user.passw) {
        if (user.is_root) {
            res.clearCookie('root');
            res.cookie('root', 'true');
        }
        res.clearCookie('auth');
        res.cookie('auth', 'true');
        res.redirect('/dashboard');
    } else {
        res.redirect('/true');
    }
}

function isValidLogObject(obj: any): obj is { username: string; password: string } {
    return typeof obj.username == "string"
        && typeof obj.password == "string";
}