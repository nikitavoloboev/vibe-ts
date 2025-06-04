import path from "path"
import os from "os"
import simpleGit from "simple-git"
import OpenAI from "openai"

async function main() {
  const args = Bun.argv
  const repoArg = args[2] || "."
  const repoPath = repoArg.startsWith("~")
    ? path.join(os.homedir(), repoArg.slice(1))
    : repoArg

  const git = simpleGit(repoPath)
  const diff = await git.diff()

  if (!diff.trim()) {
    console.log("No changes to commit")
    return
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const completion = await openai.chat.completions.create({
    model: "gpt-4-turbo",
    messages: [
      {
        role: "system",
        content: "You are an AI that writes concise git commit messages in imperative mood.",
      },
      { role: "user", content: `Generate a commit message for these changes:\n${diff}` },
    ],
    temperature: 0.2,
  })

  const message = completion.choices[0].message.content?.trim() || "update"
  await git.add("-A")
  await git.commit(message)
  console.log(message)
}

await main()
