async function doFetch(url: string, options: any = {}) {
  const res = await fetch(url, options);
  const data = await res.json();
  return { status: res.status, data };
}

async function run() {
    // There is an API /api/module-study/case-setup/PRJ-324/MA-324-01 that returns case setup.
    // Does it include attachments? Let's check.
    const res = await doFetch('http://127.0.0.1:3000/api/module-study/case-setup/PRJ-324/MA-324-01');
    const caseData = res.data.caseSetup;
    console.log("Attachments present in case data:", !!caseData.attachments);
}
run().catch(console.error);
