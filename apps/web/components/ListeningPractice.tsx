"use client";

import { listeningContent, type Level, type ListeningQuestionType } from "@kanado/content";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Headphones,
  Square,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { speak, stopSpeech } from "@/lib/speech";

const LEVELS: Level[] = ["N5", "N4", "N3"];
const TYPE_LABEL: Record<ListeningQuestionType, string> = {
  task: "Hiểu nhiệm vụ",
  "key-point": "Nắm thông tin chính",
  outline: "Hiểu ý tổng quát",
  "verbal-expression": "Biểu đạt tình huống",
  "quick-response": "Phản hồi nhanh",
};

export function ListeningPractice() {
  const [level, setLevel] = useState<Level>("N5");
  const [type, setType] = useState<ListeningQuestionType | "all">("all");
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<number>();
  const [checked, setChecked] = useState(false);
  const [transcriptVisible, setTranscriptVisible] = useState(false);
  const [audioError, setAudioError] = useState<string>();

  const lessons = useMemo(
    () => listeningContent.filter((item) => item.level === level && (type === "all" || item.type === type)),
    [level, type],
  );
  const current = lessons[index] ?? lessons[0];

  useEffect(() => stopSpeech, []);

  function reset(nextIndex = 0) {
    stopSpeech();
    setIndex(nextIndex);
    setAnswer(undefined);
    setChecked(false);
    setTranscriptVisible(false);
    setAudioError(undefined);
  }

  function move(offset: number) {
    if (!lessons.length) return;
    reset((index + offset + lessons.length) % lessons.length);
  }

  const question = current?.questions[0];
  const isCorrect = checked && answer === question?.answerIndex;
  const speechText = current?.turns.map((turn) => turn.text).join(" ") ?? "";

  async function playVoicevox() {
    setAudioError(undefined);
    try {
      await speak(speechText, { fallback: false });
    } catch {
      setAudioError(
        "Bài này chưa có audio VOICEVOX. Hãy tạo lại kho audio trước khi nghe.",
      );
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Chọn bài nghe</CardTitle>
          <CardDescription>Luyện từng dạng câu hỏi trước khi làm bài hỗn hợp.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Cấp độ</span>
            <div className="flex gap-2">
              {LEVELS.map((item) => (
                <Button
                  key={item}
                  variant={level === item ? "default" : "outline"}
                  onClick={() => {
                    setLevel(item);
                    setType("all");
                    reset();
                  }}
                >
                  {item}
                </Button>
              ))}
            </div>
          </div>
          <label className="flex min-w-56 flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Dạng bài</span>
            <Select
              value={type}
              onValueChange={(value) => {
                setType(value as ListeningQuestionType | "all");
                reset();
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue>{type === "all" ? "Tất cả dạng bài" : TYPE_LABEL[type]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả dạng bài</SelectItem>
                {Object.entries(TYPE_LABEL)
                  .filter(([item]) => listeningContent.some((lesson) => lesson.level === level && lesson.type === item))
                  .map(([item, label]) => (
                    <SelectItem key={item} value={item}>{label}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </label>
        </CardContent>
      </Card>

      {current && question && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{current.level}</Badge>
              <Badge variant="outline">{TYPE_LABEL[current.type]}</Badge>
            </div>
            <CardTitle>{current.title}</CardTitle>
            <CardDescription className="font-serif text-base leading-7 text-foreground">
              {current.situation}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {current.visualPrompt && (
              <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                <strong className="text-foreground">Bối cảnh hình:</strong> {current.visualPrompt}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button size="lg" onClick={() => void playVoicevox()}>
                <Headphones /> Nghe VOICEVOX
              </Button>
              <Button variant="outline" size="lg" onClick={stopSpeech}>
                <Square /> Dừng
              </Button>
              <Button
                variant="ghost"
                size="lg"
                aria-expanded={transcriptVisible}
                onClick={() => setTranscriptVisible((value) => !value)}
              >
                <Eye /> {transcriptVisible ? "Ẩn transcript" : "Xem transcript"}
              </Button>
            </div>

            {audioError && (
              <Alert className="border-[var(--bad)]">
                <AlertCircle />
                <AlertTitle>Chưa có audio</AlertTitle>
                <AlertDescription>{audioError}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-col gap-3">
              <p className="font-serif font-medium text-foreground">{question.prompt}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {question.choices.map((choice, choiceIndex) => {
                  const selected = answer === choiceIndex;
                  const correctChoice = checked && choiceIndex === question.answerIndex;
                  const wrongChoice = checked && selected && !correctChoice;
                  return (
                    <Button
                      key={choice}
                      variant="outline"
                      className={`h-auto min-h-10 justify-start whitespace-normal py-2.5 text-left font-serif ${
                        correctChoice
                          ? "border-[var(--good)] bg-[var(--good-bg)] text-[var(--good)]"
                          : wrongChoice
                            ? "border-[var(--bad)] bg-[var(--bad-bg)] text-[var(--bad)]"
                            : selected
                              ? "border-primary bg-primary/10 text-foreground"
                              : ""
                      }`}
                      disabled={checked}
                      onClick={() => setAnswer(choiceIndex)}
                    >
                      {choiceIndex + 1}. {choice}
                    </Button>
                  );
                })}
              </div>
            </div>

            {checked && (
              <Alert className={isCorrect ? "border-[var(--good)]" : "border-[var(--bad)]"}>
                {isCorrect ? <CheckCircle2 /> : <XCircle />}
                <AlertTitle>{isCorrect ? "Chính xác" : "Chưa đúng"}</AlertTitle>
                <AlertDescription>{question.explanation}</AlertDescription>
              </Alert>
            )}

            {transcriptVisible && (
              <div className="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4">
                <h3 className="text-sm font-semibold">Transcript</h3>
                {current.turns.map((turn, turnIndex) => (
                  <div key={`${turn.speaker}-${turnIndex}`} className="grid grid-cols-[5rem_1fr] gap-3 text-sm">
                    <span className="font-medium text-primary">{turn.speaker}</span>
                    <span className="font-serif leading-7">{turn.text}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button variant="outline" onClick={() => move(-1)}>
                <ChevronLeft /> Bài trước
              </Button>
              {!checked ? (
                <Button disabled={answer === undefined} onClick={() => setChecked(true)}>Kiểm tra đáp án</Button>
              ) : (
                <Button onClick={() => move(1)}>Bài tiếp <ChevronRight /></Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
