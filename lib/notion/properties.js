function plainText(rich) {
  return (rich ?? []).map((t) => t.plain_text).join("");
}

export function extractPropertyValue(prop) {
  if (!prop) return "";

  switch (prop.type) {
    case "title":
      return plainText(prop.title);
    case "rich_text":
      return plainText(prop.rich_text);
    case "number":
      return prop.number != null ? String(prop.number) : "";
    case "select":
      return prop.select?.name ?? "";
    case "multi_select":
      return prop.multi_select.map((o) => o.name).join(", ");
    case "status":
      return prop.status?.name ?? "";
    case "date": {
      const start = prop.date?.start ?? "";
      const end = prop.date?.end;
      if (!start) return "";
      return end ? `${start} → ${end}` : start;
    }
    case "checkbox":
      return prop.checkbox ? "true" : "false";
    case "url":
      return prop.url ?? "";
    case "email":
      return prop.email ?? "";
    case "phone_number":
      return prop.phone_number ?? "";
    case "people":
      return prop.people
        .map((p) => ("name" in p && p.name ? p.name : p.id))
        .join(", ");
    case "relation":
      return prop.relation.map((r) => r.id).join(", ");
    case "formula":
      if (prop.formula.type === "string") return prop.formula.string ?? "";
      if (prop.formula.type === "number")
        return prop.formula.number != null ? String(prop.formula.number) : "";
      if (prop.formula.type === "boolean")
        return prop.formula.boolean ? "true" : "false";
      if (prop.formula.type === "date") {
        const d = prop.formula.date;
        return d?.start ?? "";
      }
      return "";
    case "rollup":
      if (prop.rollup.type === "number")
        return prop.rollup.number != null ? String(prop.rollup.number) : "";
      if (prop.rollup.type === "date") return prop.rollup.date?.start ?? "";
      if (prop.rollup.type === "array") {
        return prop.rollup.array
          .map((item) => {
            if ("type" in item && item.type === "title")
              return plainText(item.title);
            return "";
          })
          .filter(Boolean)
          .join(", ");
      }
      return "";
    case "created_time":
      return prop.created_time;
    case "last_edited_time":
      return prop.last_edited_time;
    case "created_by": {
      const user = prop.created_by;
      return "name" in user && user.name ? user.name : user.id;
    }
    case "last_edited_by": {
      const user = prop.last_edited_by;
      return "name" in user && user.name ? user.name : user.id;
    }
    case "unique_id":
      return prop.unique_id.prefix
        ? `${prop.unique_id.prefix}-${prop.unique_id.number}`
        : String(prop.unique_id.number ?? "");
    default:
      return "";
  }
}
