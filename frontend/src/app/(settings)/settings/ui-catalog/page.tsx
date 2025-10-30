"use client";
import React from "react";
import { Button, Badge, Chip, MutedText, Divider, SectionTitle, Table, Card, CardHeader, CardBody, ProgressBar, Surface, CodeBlock, Select, Input, Textarea, Heading, Text, Blockquote, Hr } from "@ui";
import LLMHeading from "@/components/llm/LLMHeading";
import LLMParagraph from "@/components/llm/LLMParagraph";
import LLMBlockquote from "@/components/llm/LLMBlockquote";
import LLMList from "@/components/llm/LLMList";
import LLMHr from "@/components/llm/LLMHr";

export default function UiCatalogPage() {
  const [useMock, setUseMock] = React.useState<boolean>(true);
  const [progress, setProgress] = React.useState<number>(42);

  const rows = useMock
    ? [
        { id: 1, name: "Alpha", status: "active", role: "owner" },
        { id: 2, name: "Beta", status: "invited", role: "manager" },
        { id: 3, name: "Gamma", status: "suspended", role: "general" },
      ]
    : [
        { id: 101, name: "Prod-A", status: "active", role: "owner" },
        { id: 102, name: "Prod-B", status: "active", role: "general" },
      ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="section-card-title">UIカタログ</h2>
        <div className="flex items-center gap-2">
          <MutedText>{useMock ? "Mock データ" : "Prod データ風"}</MutedText>
          <Button size="sm" variant="ghost" onClick={() => setUseMock((v) => !v)}>{useMock ? "Prod に切替" : "Mock に切替"}</Button>
        </div>
      </div>
      <Divider />

      <section className="space-y-3">
        <SectionTitle>Buttons</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <Button size="sm">Primary sm</Button>
          <Button size="md">Primary md</Button>
          <Button size="lg">Primary lg</Button>
          <Button size="md" variant="ghost">Ghost</Button>
          <Button size="md" variant="danger">Danger</Button>
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle>Badges</SectionTitle>
        <div className="flex flex-wrap items-center gap-2">
          <Badge size="sm" variant="neutral">neutral</Badge>
          <Badge size="sm" variant="primary">primary</Badge>
          <Badge size="sm" variant="accent">accent</Badge>
          <Badge size="sm" variant="success">success</Badge>
          <Badge size="sm" variant="warning">warning</Badge>
          <Badge size="sm" variant="error">error</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge size="md" variant="neutral">neutral</Badge>
          <Badge size="md" variant="primary">primary</Badge>
          <Badge size="md" variant="accent">accent</Badge>
          <Badge size="md" variant="success">success</Badge>
          <Badge size="md" variant="warning">warning</Badge>
          <Badge size="md" variant="error">error</Badge>
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle>Chips</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <Chip size="sm" variant="neutral">Neutral</Chip>
          <Chip size="sm" variant="accent">Accent</Chip>
          <Chip size="md" variant="success">Success</Chip>
          <Chip size="md" variant="warning">Warning</Chip>
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle>Inputs</SectionTitle>
        <div className="grid gap-2 max-w-2xl">
          <Input placeholder="Input" />
          <Select>
            <option>Option A</option>
            <option>Option B</option>
          </Select>
          <Textarea placeholder="Textarea" />
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle>Cards</SectionTitle>
        <div className="grid md:grid-cols-2 gap-3">
          <Card>
            <CardHeader>標準カード</CardHeader>
            <CardBody>
              <MutedText level={40}>本文テキスト。説明など。</MutedText>
              <div className="mt-2"><Button size="sm">アクション</Button></div>
            </CardBody>
          </Card>
          <Surface variant="panel" bordered radius="md" className="p-3">
            <div className="font-medium mb-1">Surface(panel)</div>
            <MutedText level={40}>背景差の確認用。</MutedText>
          </Surface>
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle>Typography（一般）</SectionTitle>
        <Heading level={1}>見出し H1</Heading>
        <Heading level={2}>見出し H2</Heading>
        <Heading level={3}>見出し H3</Heading>
        <Text>本文 Paragraph（一般用途）</Text>
        <Blockquote>引用: 一般用途の Blockquote</Blockquote>
        <Hr />
      </section>

      <section className="space-y-3">
        <SectionTitle>LLM 表示（専用原子）</SectionTitle>
        <LLMHeading level={2}>LLM H2</LLMHeading>
        <LLMParagraph>LLM用 Paragraph。行間・色階調は LLM向けに最適化。</LLMParagraph>
        <LLMBlockquote>LLM 用の引用スタイル。</LLMBlockquote>
        <LLMHr />
        <div>
          <LLMList>
            <li>箇条書き1</li>
            <li>箇条書き2</li>
          </LLMList>
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle>Table</SectionTitle>
        <Table size="sm" style={{ tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "40%" }} />
            <col style={{ width: "30%" }} />
            <col style={{ width: "30%" }} />
          </colgroup>
          <Table.Thead>
            <Table.Tr>
              <Table.Th sortable aria-sort="none">Name</Table.Th>
              <Table.Th sortable aria-sort="none">Status</Table.Th>
              <Table.Th>Role</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((r) => (
              <Table.Tr key={r.id}>
                <Table.Td>{r.name}</Table.Td>
                <Table.Td>
                  {r.status === "active" && <Badge size="sm" variant="success">active</Badge>}
                  {r.status === "invited" && <Badge size="sm" variant="accent">invited</Badge>}
                  {r.status === "suspended" && <Badge size="sm" variant="warning">suspended</Badge>}
                </Table.Td>
                <Table.Td>{r.role}</Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </section>

      <section className="space-y-3">
        <SectionTitle>Progress</SectionTitle>
        <div className="grid gap-2 max-w-xl">
          <ProgressBar value={progress} />
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => setProgress((v) => Math.max(0, v - 10))}>-10%</Button>
            <Button size="sm" onClick={() => setProgress((v) => Math.min(100, v + 10))}>+10%</Button>
            <MutedText level={40}>{progress.toFixed(0)}%</MutedText>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle>CodeBlock</SectionTitle>
        <CodeBlock language="ts" text={`function sum(a: number, b: number) {\n  return a + b;\n}`}>sum(1,2)</CodeBlock>
      </section>
    </div>
  );
}


