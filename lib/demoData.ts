import { db } from "./db";

export const article = `There is a quiet kind of magic in paying attention. Not the kind that announces itself, but the kind that reveals what was there all along — the warmth of a cup in your hands, the shifting light on a familiar wall, the way a conversation changes when you truly listen.

In a world that rewards speed, attention has become a rare and valuable thing. We move through our days collecting information, yet often miss the experience of being alive in them. We scroll, we skim, we move on. But what happens when we choose to linger?

The writer Mary Oliver once asked, “Tell me, what is it you plan to do with your one wild and precious life?” It is a question that invites us not to do more, but to notice more. To cultivate a sense of curiosity about the ordinary. To find something worth remembering in the seemingly unremarkable.

Attention is a practice, not a personality trait. It begins with small, deliberate choices: putting your phone away during a meal, taking a different route home, or pausing to observe the sky before stepping inside. These moments may feel insignificant, but they gradually reshape the way we see.

When we pay attention, we become more receptive to the world around us. A walk becomes a discovery. A conversation becomes a connection. Even a difficult day holds a lesson we might otherwise have overlooked.

There is no perfect way to begin. You do not need a quieter life or a longer morning. You only need a willingness to be present in the life you already have. Start with one thing. Look at it closely. Let your mind settle there.

Perhaps the art of paying attention is really the art of coming back — back to the moment, back to ourselves, back to the extraordinary hidden inside the everyday. And perhaps, in learning to notice, we learn to live a little more fully.`;

export const dictionary: [string, string, string, string][] = [
  ["linger", "/ˈlɪŋ.ɡər/", "verb", "nán lại, lưu lại"],
  ["cultivate", "/ˈkʌl.tɪ.veɪt/", "verb", "nuôi dưỡng, trau dồi"],
  ["receptive", "/rɪˈsep.tɪv/", "adjective", "sẵn sàng tiếp thu"],
  ["deliberate", "/dɪˈlɪb.ər.ət/", "adjective", "có chủ đích, thận trọng"],
  [
    "unremarkable",
    "/ˌʌn.rɪˈmɑː.kə.bəl/",
    "adjective",
    "bình thường, không nổi bật",
  ],
  ["curiosity", "/ˌkjʊə.riˈɒs.ə.ti/", "noun", "sự tò mò"],
  ["reshape", "/ˌriːˈʃeɪp/", "verb", "định hình lại"],
  ["precious", "/ˈpreʃ.əs/", "adjective", "quý giá"],
  ["observe", "/əbˈzɜːv/", "verb", "quan sát"],
  ["willingness", "/ˈwɪl.ɪŋ.nəs/", "noun", "sự sẵn lòng"],
  ["extraordinary", "/ɪkˈstrɔː.dən.ər.i/", "adjective", "phi thường"],
  ["gradually", "/ˈɡrædʒ.u.ə.li/", "adverb", "dần dần"],
  ["reward", "/rɪˈwɔːd/", "verb", "tưởng thưởng"],
  ["reveal", "/rɪˈviːl/", "verb", "tiết lộ"],
  ["familiar", "/fəˈmɪl.i.ər/", "adjective", "quen thuộc"],
  ["valuable", "/ˈvæl.ju.ə.bəl/", "adjective", "có giá trị"],
  ["connection", "/kəˈnek.ʃən/", "noun", "sự kết nối"],
  ["potential", "/pəˈten.ʃəl/", "noun", "tiềm năng"],
  ["meaningful", "/ˈmiː.nɪŋ.fəl/", "adjective", "có ý nghĩa"],
  ["remarkable", "/rɪˈmɑː.kə.bəl/", "adjective", "đáng chú ý"],
];

export const normalize = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/^[^\p{L}]+|[^\p{L}]+$/gu, "")
    .replace(/\s+/g, " ");

export async function ensureSeedData() {
  const noteCount = await db.notes.count();
  if (noteCount > 0) return;

  const now = Date.now();
  const topic1Id = "topic-personal-growth";
  const topic2Id = "topic-everyday-stories";

  await db.topics.bulkPut([
    {
      id: topic1Id,
      name: "Personal growth",
      createdAtMs: now,
      updatedAtMs: now,
    },
    {
      id: topic2Id,
      name: "Everyday stories",
      createdAtMs: now,
      updatedAtMs: now,
    },
  ]);

  const note1Id = "note-the-art-of-paying-attention";
  const note2Id = "note-small-habits-meaningful-change";
  const note3Id = "note-a-slower-kind-of-sunday";

  await db.notes.bulkPut([
    {
      id: note1Id,
      topicId: topic1Id,
      title: "The art of paying attention",
      content: article,
      version: 1,
      createdAtMs: now,
      updatedAtMs: now,
    },
    {
      id: note2Id,
      topicId: topic1Id,
      title: "Small habits, meaningful change",
      content:
        "We cultivate meaningful change through small, deliberate choices. A quiet morning can become a remarkable opportunity to begin again.\n\nBe curious about your own potential. Every habit is a chance to reshape your day.",
      version: 1,
      createdAtMs: now,
      updatedAtMs: now,
    },
    {
      id: note3Id,
      topicId: topic2Id,
      title: "A slower kind of Sunday",
      content:
        "The morning light was warm and gentle. I decided to linger over coffee and observe the world outside my window.",
      version: 1,
      createdAtMs: now,
      updatedAtMs: now,
    },
  ]);

  const todayStr = new Date().toISOString().split("T")[0] ?? "";

  for (let i = 0; i < dictionary.length; i++) {
    const entry = dictionary[i];
    if (!entry) continue;
    const [text, ipa, pos, meaning] = entry;
    const wordId = `word-seed-${i + 1}`;
    const status =
      i < 3 ? "LEARNING"
      : i < 9 ? "NEW"
      : i < 17 ? "TEMP_REMEMBERED"
      : "MASTERED";
    const streak =
      i < 9 ? 0
      : i < 17 ? 2
      : 4;

    const sentence =
      article
        .split(/(?<=[.?!])\s+/)
        .find((s) => new RegExp(`\\b${text}\\b`, "i").test(s)) ||
      `There is something ${text} about the way we experience the world.`;

    await db.words.put({
      id: wordId,
      noteId: note1Id,
      text,
      ipa,
      partOfSpeech: pos,
      pos,
      translation: meaning,
      meaning,
      exampleContext: sentence,
      exampleTranslation:
        "Hãy chậm lại để cảm nhận những điều ý nghĩa trong cuộc sống.",
      status,
      correctStreak: streak,
      difficulty: 2.5,
      intervalDays: streak > 0 ? streak * 2 : 1,
      nextReviewAt: todayStr,
      failedEssayStreak: 0,
      version: 1,
      createdAtMs: now - i * 10000,
      updatedAtMs: now - i * 10000,
    });

    await db.wordContexts.put({
      id: `ctx-seed-${i + 1}`,
      wordId,
      noteId: note1Id,
      noteTitle: "The art of paying attention",
      sentence,
      translation:
        "Hãy chậm lại để cảm nhận những điều ý nghĩa trong cuộc sống.",
      partOfSpeech: pos,
      pos,
      createdAtMs: now - i * 10000,
      updatedAtMs: now - i * 10000,
    });
  }
}
