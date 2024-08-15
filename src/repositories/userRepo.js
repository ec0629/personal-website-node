import crypto from "node:crypto";
import { dbGet, dbPrepare, dbRun } from "../db.js";

const insertUserProfileStatement = dbPrepare(`
  insert into user 
    (id, email, given_name, family_name, nickname, access_token, refresh_token, expires_at, is_admin)
  values (@id, @email, @givenName, @familyName, @nickname, @accessToken, @refreshToken, @expiresAt, @isAdmin)
  `);

const updateUserProfileStatement = dbPrepare(`
  update user set given_name=@givenName, family_name=@familyName, nickname=@nickname,
    access_token=@accessToken, refresh_token=@refreshToken, expires_at=@expiresAt
  where id=@id
  `);

const getUserIdByEmail = dbPrepare(`
  select id from user where email = ?
  `);

const getUserProfileByIdStatement = dbPrepare(`
  select
    id, email, nickname,
    given_name as "givenName",
    family_name as "familyName",
    access_token as "accessToken",
    refresh_token as "refreshToken",
    expires_at as "expiresAt",
    is_admin as "isAdmin"
  from user where id=?
  `);

export function persistUserProfile(user) {
  if (!user.id) {
    const row = dbGet(getUserIdByEmail, [user.email]);
    user.id = row?.id;
  }

  if (user.id) {
    console.log("Updating user profile.");
    dbRun(updateUserProfileStatement, user);
    return user;
  } else {
    console.log("Inserting user profile.");
    return insertUserProfile(user);
  }
}

export function getUserProfileById(id) {
  return dbGet(getUserProfileByIdStatement, [id]);
}

function insertUserProfile(user) {
  user.id = crypto.randomUUID();
  user.isAdmin = userIsAdmin(user.email);
  dbRun(insertUserProfileStatement, user);
  return user;
}

function userIsAdmin(email) {
  return email === process.env.ADMIN_EMAIL_ADDRESS ? 1 : 0;
}
