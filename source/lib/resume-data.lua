dofile(assert(kpse.find_file("lualibs.lua"), "TeX Live lualibs.lua was not found"))

local resume = {}
local data_directory = "data/portfolio/"

local function load_json(file_name)
  local path = data_directory .. file_name .. ".json"
  local value = utilities.json.load(path)
  if value == nil then
    error("Could not load portfolio data from " .. path)
  end
  return value
end

resume.data = {
  profile = load_json("profile"),
  companies = load_json("companies"),
  positions = load_json("positions"),
  professionalWork = load_json("professional-work"),
  skills = load_json("skills"),
  recognition = load_json("recognition"),
  education = load_json("education"),
}

local replacements = {
  ["\\"] = "\\textbackslash{}",
  ["{"] = "\\{",
  ["}"] = "\\}",
  ["%"] = "\\%",
  ["$"] = "\\$",
  ["&"] = "\\&",
  ["#"] = "\\#",
  ["_"] = "\\_",
  ["^"] = "\\textasciicircum{}",
  ["~"] = "\\textasciitilde{}",
}

function resume.escape(value)
  if value == nil then
    error("Cannot render a missing portfolio value")
  end

  local escaped = tostring(value):gsub(".", function(character)
    return replacements[character] or character
  end)
  escaped = escaped:gsub("–", "--"):gsub("—", "---"):gsub("’", "'")
  return escaped
end

function resume.for_company(records, company_id)
  local matches = {}
  for _, record in ipairs(records) do
    if record.companyId == company_id then
      matches[#matches + 1] = record
    end
  end
  return matches
end

function resume.define(command_name, value)
  token.set_macro(command_name, resume.escape(value), "global")
end

function resume.write(value)
  tex.sprint(luatexbase.catcodetables.latex, resume.escape(value))
end

function resume.line(value)
  tex.print(luatexbase.catcodetables.latex, value)
end

return resume
