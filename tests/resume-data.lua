kpse.set_program_name("luatex")
local resume = dofile("source/lib/resume-data.lua")

assert(resume.escape("C# & Type_Script") == "C\\# \\& Type\\_Script")
assert(resume.escape("one–two — it’s") == "one--two --- it's")
assert(select("#", resume.escape("one value")) == 1)
assert(#resume.data.companies > 0)
assert(#resume.data.positions > 0)

local first_company = resume.data.companies[1]
local positions = resume.for_company(resume.data.positions, first_company.id)
assert(#positions > 0)
for _, position in ipairs(positions) do
  assert(position.companyId == first_company.id)
end

print("Lua resume data checks passed")
