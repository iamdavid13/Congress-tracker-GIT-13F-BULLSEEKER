const DEFAULT_BASE = "https://www.govtrack.us/api/v2";

function buildUrl(base, path, params = {}) {
  const url = new URL(path, base);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

export async function fetchGovTrack(path, params, base = DEFAULT_BASE) {
  const url = buildUrl(base, path, params);
  const response = await fetch(url, {
    headers: {
      "Accept": "application/json"
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GovTrack error ${response.status}: ${body}`);
  }

  return response.json();
}

export function normalizeMember(role) {
  const person = role.person || {};
  const name = person.name || person.lastname || role.person__name || "Unknown";
  const party = role.party || role.party__name || "";
  const state = role.state || role.state__name || "";
  const chamber = role.role_type || role.role_type_label || "";
  const district = role.district || "";

  return {
    id: person.id || role.person__id || role.id,
    name,
    party,
    state,
    chamber,
    district,
    image: person.photo || null,
    website: person.link || null
  };
}

export function normalizeBill(bill) {
  return {
    id: bill.id,
    title: bill.title || bill.short_title || "Untitled",
    number: bill.display_number || bill.bill_type + " " + bill.number,
    status: bill.current_status_label || bill.current_status || "",
    introduced: bill.introduced_date || "",
    sponsor: bill.sponsor_name || "",
    link: bill.link || null
  };
}

export function normalizeCommittee(committee) {
  return {
    id: committee.id,
    name: committee.name,
    chamber: committee.chamber || committee.committee_type || "",
    type: committee.committee_type || "",
    link: committee.link || null
  };
}

export function normalizeVote(vote) {
  return {
    id: vote.id,
    question: vote.question || "",
    result: vote.result || "",
    chamber: vote.chamber || "",
    date: vote.created || vote.date || "",
    link: vote.link || null
  };
}
