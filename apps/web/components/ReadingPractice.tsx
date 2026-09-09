"use client";

import { readingContent, type Level, type ReadingQuestionType } from "@kanado/content";
import { CheckCircle2, ChevronLeft, ChevronRight, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
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

const LEVELS: Level[] = ["N5", "N4", "N3"];
const TYPE_LABEL: Record<ReadingQuestionType, string> = {
  short: "Đoạn ngắn",
  mid: "Đoạn trung bình",
  long: "Đoạn dài",
  information: "Tìm thông tin",
};

export function ReadingPractice() {
  const [level, setLevel] = useState<Level>("N5");
  const [type, setType] = useState<ReadingQuestionType | "all">("all");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);

  const lessons = useMemo(
    () => readingContent.filter((item) => item.level === level && (type === "all" || item.type === type)),
    [level, type],
  );
  const current = lessons[index] ?? lessons[0];

  function reset(nextIndex = 0) {
    setIndex(nextIndex);
    setAnswers({});
    setChecked(false);
  }

  function move(offset: number) {
    if (!lessons.length) return;
    reset((index + offset + lessons.length) % lessons.length);
  }

  const complete = current?.questions.every((_, questionIndex) => answers[questionIndex] !== undefined);
  const correct = current?.questions.filter(
    (question, questionIndex) => answers[questionIndex] === question.answerIndex,
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Chọn bài đọc</CardTitle>
          <CardDescription>Luyện đúng độ dài và dạng câu hỏi của JLPT.</CardDescription>
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
          <label className="flex min-w-52 flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Dạng bài</span>
            <Select
              value={type}
              onValueChange={(value) => {
                setType(value as ReadingQuestionType | "all");
                reset();
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue>{type === "all" ? "Tất cả dạng bài" : TYPE_LABEL[type]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả dạng bài</SelectItem>
                {Object.entries(TYPE_LABEL)
                  .filter(([item]) => readingContent.some((lesson) => lesson.level === level && lesson.type === item))
                  .map(([item, label]) => (
                    <SelectItem key={item} value={item}>{label}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </label>
        </CardContent>
      </Card>

      {current && (
        <>
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{current.level}</Badge>
                <Badge variant="outline">{TYPE_LABEL[current.type]}</Badge>
                <span className="text-xs text-muted-foreground">{current.characterCount} ký tự</span>
              </div>
              <CardTitle>{current.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-line border-l-2 border-primary/40 pl-5 font-serif text-lg leading-9 text-foreground">
                {current.passage}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Câu hỏi</CardTitle>
              <CardDescription>Chọn đủ đáp án rồi kiểm tra kết quả.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {current.questions.map((question, questionIndex) => (
                <div key={question.prompt} className="flex flex-col gap-3">
                  <p className="font-medium text-foreground">
                    {questionIndex + 1}. <span className="font-serif">{question.prompt}</span>
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {question.choices.map((choice, choiceIndex) => {
                      const selected = answers[questionIndex] === choiceIndex;
                      const isCorrect = checked && choiceIndex === question.answerIndex;
                      const isWrong = checked && selected && !isCorrect;
                      return (
                        <Button
                          key={choice}
                          variant="outline"
                          className={`h-auto min-h-10 justify-start whitespace-normal py-2.5 text-left font-serif ${
                            isCorrect
                              ? "border-[var(--good)] bg-[var(--good-bg)] text-[var(--good)]"
                              : isWrong
                                ? "border-[var(--bad)] bg-[var(--bad-bg)] text-[var(--bad)]"
                                : selected
                                  ? "border-primary bg-primary/10 text-foreground"
                                  : ""
                          }`}
                          disabled={checked}
                          onClick={() => setAnswers((value) => ({ ...value, [questionIndex]: choiceIndex }))}
                        >
                          {choiceIndex + 1}. {choice}
                        </Button>
                      );
                    })}
                  </div>
                  {checked && (
                    <p className="text-sm text-muted-foreground">{question.explanation}</p>
                  )}
                </div>
              ))}

              {checked && (
                <Alert className={correct === current.questions.length ? "border-[var(--good)]" : "border-[var(--bad)]"}>
                  {correct === current.questions.length ? <CheckCircle2 /> : <XCircle />}
                  <AlertTitle>Đúng {correct}/{current.questions.length} câu</AlertTitle>
                  <AlertDescription>
                    {correct === current.questions.length
                      ? "Bạn đã nắm đúng thông tin trong bài."
                      : "Xem phần giải thích dưới từng câu trước khi sang bài tiếp theo."}
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button variant="outline" onClick={() => move(-1)}>
                  <ChevronLeft /> Bài trước
                </Button>
                {!checked ? (
                  <Button disabled={!complete} onClick={() => setChecked(true)}>Kiểm tra đáp án</Button>
                ) : (
                  <Button onClick={() => move(1)}>Bài tiếp <ChevronRight /></Button>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
