function parseJSONSafe(s, fb){ try{return s?JSON.parse(s):fb;}catch{return fb;} }
const defaults = {
  formatting: {
    no_abbreviations: ["Mon-Wed-Fri","Mon/Tues","w/","btw"],
    require_owner_callouts: true,
    owner_fields: ["Assignee","Due Date","Channel","Priority"]
  },
  tone: { dummy_proof: true, avoid_jargon: true, be_direct: true },
  outputs: { explain_where_to_post: true, address_responsible_person: true, include_checklist: true },
  routes: { tag_people: true, allowed_channels: ["#work-updates","#client-requests","#design","#seo","#ads"] }
};
module.exports = async (req, res) => {
  const overrides = parseJSONSafe(process.env.STRICT_OVERRIDES_JSON, {});
  res.status(200).json({ ok: true, strict: { ...defaults, ...overrides } });
};
