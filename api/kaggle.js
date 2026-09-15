const token = "KGAT_ae69e826bed19700deb2987624c44682";
const url = "https://www.kaggle.com/api/v1/datasets/download/rodsaldanha/arketing-campaign/marketing_campaign.csv";
async function main() {
  const response = await fetch(url, {
    headers: { Authorization: "Bearer " + token }
  });
  console.log("Status:", response.status);
  const text = await response.text();
  const rows = text.trim().split("\n").slice(1);
  const accepted = rows.filter(row => row.trim().split(";").at(-1) === "1").length;
  console.log("Customers:", rows.length);
  console.log("Accepted the last campaign:", accepted);

  const campaignColumns = {
    "AcceptedCmp1": 23,
    "AcceptedCmp2": 24,
    "AcceptedCmp3": 20,
    "AcceptedCmp4": 21,
    "AcceptedCmp5": 22
  };

  for (const campaign of ["AcceptedCmp1", "AcceptedCmp2", "AcceptedCmp3", "AcceptedCmp4", "AcceptedCmp5"]) {
    const index = campaignColumns[campaign];
    const count = rows.filter(row => row.trim().split(";")[index] === "1").length;
    console.log(campaign + ":", count);
  }
}
main();
