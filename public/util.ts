type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type InputTag = "input" | "textarea" | "json";
type Field = InputTag | { [key: string]: Field };
type Fields = Record<string, Field>;

type operation = {
  name: string;
  endpoint: string;
  method: HttpMethod;
  fields: Fields;
};

const operations: operation[] = [
  {
    name: "Get Session User (logged in user)",
    endpoint: "/api/session",
    method: "GET",
    fields: {},
  },
  {
    name: "Create User",
    endpoint: "/api/users",
    method: "POST",
    fields: { username: "input", password: "input" },
  },
  {
    name: "Login",
    endpoint: "/api/login",
    method: "POST",
    fields: { username: "input", password: "input" },
  },
  {
    name: "Logout",
    endpoint: "/api/logout",
    method: "POST",
    fields: {},
  },
  {
    name: "Get Users (empty for all)",
    endpoint: "/api/users/:username",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "Get Friends",
    endpoint: "/api/friends/",
    method: "GET",
    fields: {},
  },
  {
    name: "Delete Friend",
    endpoint: "/api/friends/:friend",
    method: "DELETE",
    fields: { friend: "input" },
  },
  {
    name: "Get Friend Requests",
    endpoint: "/api/friend/requests",
    method: "GET",
    fields: {},
  },
  {
    name: "Send Friend Request",
    endpoint: "/api/friend/requests/:to",
    method: "POST",
    fields: { to: "input", message: "input", messageType: "input" },
  },
  {
    name: "Accept Friend Request",
    endpoint: "/api/friend/accept/:from",
    method: "PUT",
    fields: { from: "input" },
  },
  {
    name: "Reject Friend Request",
    endpoint: "/api/friend/reject/:from",
    method: "PUT",
    fields: { from: "input" },
  },
  {
    name: "Get Chat Messages",
    endpoint: "/api/chats/chat/:username?",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "Get Chats",
    endpoint: "/api/chats/",
    method: "GET",
    fields: {},
  },
  {
    name: "Send Chat Message",
    endpoint: "/api/chats/chat/:to",
    method: "POST",
    fields: { to: "input", message: "input", messageType: "input" },
  },
  {
    name: "Start Collaboration",
    endpoint: "/api/collaborativeModes",
    method: "POST",
    fields: { username: "input", message: "input" },
  },
  {
    name: "Collaborate",
    endpoint: "/api/collaborativeModes",
    method: "PATCH",
    fields: { username: "input", message: "input" },
  },
  {
    name: "Finish Collaboration",
    endpoint: "/api/collaborativeModes",
    method: "DELETE",
    fields: { username: "input" },
  },
  {
    name: "Get CollabMode Content",
    endpoint: "/api/collaborativeMode/content",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "Get CollabMode",
    endpoint: "/api/collaborativeMode",
    method: "GET",
    fields: { username: "input" },
  },
  {
    name: "Get Single Gallery Item",
    endpoint: "/api/galleries/gallery/items/:itemId?",
    method: "GET",
    fields: { itemId: "input" },
  },

  {
    name: "Get Items by Gallery",
    endpoint: "/api/galleries/gallery/:galleryName?",
    method: "GET",
    fields: { galleryName: "input" },
  },
  {
    name: "Get User's Galleries",
    endpoint: "/api/galleries/",
    method: "GET",
    fields: {},
  },
  {
    name: "Delete Item from Gallery",
    endpoint: "/api/galleries/gallery/items",
    method: "DELETE",
    fields: { itemId: "input" },
  },
  {
    name: "Get Single Item from Trash",
    endpoint: "/api/trash/item/:itemId?",
    method: "GET",
    fields: { itemId: "input" },
  },
  {
    name: "Get Trash",
    endpoint: "/api/trash",
    method: "GET",
    fields: {},
  },
  {
    name: "Delete Item from Trash",
    endpoint: "/api/trash/item/:itemId?",
    method: "DELETE",
    fields: { itemId: "input" },
  },
  {
    name: "Add Item to Trash",
    endpoint: "/api/trash",
    method: "POST",
    fields: { item: "input" },
  },

  // comment out posts because we don't need it for app
  /* {
    name: "Get Posts (empty for all)",
    endpoint: "/api/posts",
    method: "GET",
    fields: { author: "input" },
  },
  {
    name: "Create Post",
    endpoint: "/api/posts",
    method: "POST",
    fields: { content: "input" },
  },
  {
    name: "Update Post",
    endpoint: "/api/posts/:id",
    method: "PATCH",
    fields: { id: "input", update: { content: "input", options: { backgroundColor: "input" } } },
  },
  {
    name: "Delete Post",
    endpoint: "/api/posts/:id",
    method: "DELETE",
    fields: { id: "input" },
  },*/
];

// Do not edit below here.
// If you are interested in how this works, feel free to ask on forum!

function updateResponse(code: string, response: string) {
  document.querySelector("#status-code")!.innerHTML = code;
  document.querySelector("#response-text")!.innerHTML = response;
}

async function request(method: HttpMethod, endpoint: string, params?: unknown) {
  try {
    if (method === "GET" && params) {
      endpoint += "?" + new URLSearchParams(params as Record<string, string>).toString();
      params = undefined;
    }

    const res = fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: params ? JSON.stringify(params) : undefined,
    });

    return {
      $statusCode: (await res).status,
      $response: await (await res).json(),
    };
  } catch (e) {
    console.log(e);
    return {
      $statusCode: "???",
      $response: { error: "Something went wrong, check your console log.", details: e },
    };
  }
}

function fieldsToHtml(fields: Record<string, Field>, indent = 0, prefix = ""): string {
  return Object.entries(fields)
    .map(([name, tag]) => {
      return `
        <div class="field" style="margin-left: ${indent}px">
          <label>${name}:
          ${typeof tag === "string" ? `<${tag} name="${prefix}${name}"></${tag}>` : fieldsToHtml(tag, indent + 10, prefix + name + ".")}
          </label>
        </div>`;
    })
    .join("");
}

function getHtmlOperations() {
  return operations.map((operation) => {
    return `<li class="operation">
      <h3>${operation.name}</h3>
      <form class="operation-form">
        <input type="hidden" name="$endpoint" value="${operation.endpoint}" />
        <input type="hidden" name="$method" value="${operation.method}" />
        ${fieldsToHtml(operation.fields)}
        <button type="submit">Submit</button>
      </form>
    </li>`;
  });
}

function prefixedRecordIntoObject(record: Record<string, string>) {
  const obj: any = {}; // eslint-disable-line
  for (const [key, value] of Object.entries(record)) {
    if (!value) {
      continue;
    }
    const keys = key.split(".");
    const lastKey = keys.pop()!;
    let currentObj = obj;
    for (const key of keys) {
      if (!currentObj[key]) {
        currentObj[key] = {};
      }
      currentObj = currentObj[key];
    }
    currentObj[lastKey] = value;
  }
  return obj;
}

async function submitEventHandler(e: Event) {
  e.preventDefault();
  const form = e.target as HTMLFormElement;
  const { $method, $endpoint, ...reqData } = Object.fromEntries(new FormData(form));

  // Replace :param with the actual value.
  const endpoint = ($endpoint as string).replace(/:(\w+)/g, (_, key) => {
    const param = reqData[key] as string;
    delete reqData[key];
    return param;
  });

  const data = prefixedRecordIntoObject(reqData as Record<string, string>);

  updateResponse("", "Loading...");
  const response = await request($method as HttpMethod, endpoint as string, Object.keys(data).length > 0 ? data : undefined);
  updateResponse(response.$statusCode.toString(), JSON.stringify(response.$response, null, 2));
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#operations-list")!.innerHTML = getHtmlOperations().join("");
  document.querySelectorAll(".operation-form").forEach((form) => form.addEventListener("submit", submitEventHandler));
});
