## Create a course selling website

### Description
1. Admins should be able to sign up
2. Admins should be able to create courses
   1. Course has a title, description, price, and image link
   2. Course should be able to be published or unpublished
3. Admins should be able to edit courses
4. Users should be able to sign up
5. Users should be able to purchase courses
6. Users should be able to view purchased coursesimport { get } from "@vercel/edge-config";
import { collectEvents } from "next-collect/server";
import type { NextMiddleware } from "next/server";
import { NextResponse, userAgent } from "next/server";

import { CONSOLE_URL, WEBAPP_URL, WEBSITE_URL } from "@calcom/lib/constants";
import { isIpInBanlist } from "@calcom/lib/getIP";
import { extendEventData, nextCollectBasicSettings } from "@calcom/lib/telemetry";

const middleware: NextMiddleware = async (req) => {
  const url = req.nextUrl;
  const requestHeaders = new Headers(req.headers);
  /**
   * We are using env variable to toggle new-booker because using flags would be an unnecessary delay for booking pages
   * Also, we can't easily identify the booker page requests here(to just fetch the flags for those requests)
   */

  if (isIpInBanlist(req) && url.pathname !== "/api/nope") {
    // DDOS Prevention: Immediately end request with no response - Avoids a redirect as well initiated by NextAuth on invalid callback
    req.nextUrl.pathname = "/api/nope";
    return NextResponse.redirect(req.nextUrl);
  }

  if (!url.pathname.startsWith("/api")) {
    //
    // NOTE: When tRPC hits an error a 500 is returned, when this is received
    //       by the application the user is automatically redirected to /auth/login.
    //
    //     - For this reason our matchers are sufficient for an app-wide maintenance page.
    //
    try {
      // Check whether the maintenance page should be shown
      const isInMaintenanceMode = await get<boolean>("isInMaintenanceMode");
      // If is in maintenance mode, point the url pathname to the maintenance page
      if (isInMaintenanceMode) {
        req.nextUrl.pathname = `/maintenance`;
        return NextResponse.rewrite(req.nextUrl);
      }
    } catch (error) {
      // show the default page if EDGE_CONFIG env var is missing,
      // but log the error to the console
      // console.error(error);
    }
  }

  if (["/api/collect-events", "/api/auth"].some((p) => url.pathname.startsWith(p))) {
    const callbackUrl = url.searchParams.get("callbackUrl");
    const { isBot } = userAgent(req);

    if (
      isBot ||
      (callbackUrl && ![CONSOLE_URL, WEBAPP_URL, WEBSITE_URL].some((u) => callbackUrl.startsWith(u))) ||
      isIpInBanlist(req)
    ) {
      // DDOS Prevention: Immediately end request with no response - Avoids a redirect as well initiated by NextAuth on invalid callback
      req.nextUrl.pathname = "/api/nope";
      return NextResponse.redirect(req.nextUrl);
    }
  }

  // Don't 404 old routing_forms links
  if (url.pathname.startsWith("/apps/routing_forms")) {
    url.pathname = url.pathname.replace("/apps/routing_forms", "/apps/routing-forms");
    return NextResponse.rewrite(url);
  }

  if (url.pathname.startsWith("/api/trpc/")) {
    requestHeaders.set("x-cal-timezone", req.headers.get("x-vercel-ip-timezone") ?? "");
  }

  if (url.pathname.startsWith("/auth/login")) {
    // Use this header to actually enforce CSP, otherwise it is running in Report Only mode on all pages.
    requestHeaders.set("x-csp-enforce", "true");
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
};

export const config = {
  matcher: [
    "/:path*",
    "/api/collect-events/:path*",
    "/api/auth/:path*",
    "/apps/routing_forms/:path*",
    "/:path*/embed",
    "/api/trpc/:path*",
    "/auth/login",
  ],
};

export default collectEvents({
  middleware,
  ...nextCollectBasicSettings,
  cookieName: "__clnds",
  extend: extendEventData,
});

7. Users should be able to view all courses

## Routes
### Admin Routes:
 - POST /admin/signup
   Description: Creates a new admin account.
   Input: { username: 'admin', password: 'pass' }
   Output: { message: 'Admin created successfully' }
 - POST /admin/login
   Description: Authenticates an admin. It requires the admin to send username and password in the headers.
   Input: Headers: { 'username': 'admin', 'password': 'pass' }
   Output: { message: 'Logged in successfully' }
 - POST /admin/courses
   Description: Creates a new course.
   Input: Headers: { 'username': 'admin', 'password': 'pass' }
   Input: Body: { title: 'course title', description: 'course description', price: 100, imageLink: 'https://linktoimage.com', published: true }
   Output: { message: 'Course created successfully', courseId: 1 }
 - PUT /admin/courses/:courseId
   Description: Edits an existing course. courseId in the URL path should be replaced with the ID of the course to be edited.
   Input: Headers: { 'username': 'admin', 'password': 'pass' }
   Input: Body { title: 'updated course title', description: 'updated course description', price: 100, imageLink: 'https://updatedlinktoimage.com', published: false }
   Output: { message: 'Course updated successfully' }
 - GET /admin/courses
   Description: Returns all the courses.
   Input: Headers: { 'username': 'admin', 'password': 'pass' }
   Output: { courses: [ { id: 1, title: 'course title', description: 'course description', price: 100, imageLink: 'https://linktoimage.com', published: true }, ... ] }
   User Routes:

### User routes
 - POST /users/signup
   Description: Creates a new user account.
   Input: { username: 'user', password: 'pass' }
   Output: { message: 'User created successfully' } 
 - POST /users/login
   Description: Authenticates a user. It requires the user to send username and password in the headers.
   Input: Headers: { 'username': 'user', 'password': 'pass' }
   Output: { message: 'Logged in successfully' }
 - GET /users/courses
   Description: Lists all the courses.
   Input: Headers: { 'username': 'admin', 'password': 'pass' }
   Output: { courses: [ { id: 1, title: 'course title', description: 'course description', price: 100, imageLink: 'https://linktoimage.com', published: true }, ... ] }
 - POST /users/courses/:courseId
   Description: Purchases a course. courseId in the URL path should be replaced with the ID of the course to be purchased.
   Input: Headers: { 'username': 'admin', 'password': 'pass' }
   Output: { message: 'Course purchased successfully' }
 - GET /users/purchasedCourses
   Description: Lists all the courses purchased by the user.
   Input: Headers: { 'username': 'admin', 'password': 'pass' }
   Output: { purchasedCourses: [ { id: 1, title: 'course title', description: 'course description', price: 100, imageLink: 'https://linktoimage.com', published: true }, ... ] }
