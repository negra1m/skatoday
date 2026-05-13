"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { updateWaterConfigAction } from "@/app/(app)/agua/actions";

export function WaterConfigForm({
  goalMl,
  autoGoalMl,
  glassSizeMl,
  wakeStart,
  wakeEnd,
  notificationsEnabled,
  soundEnabled,
}: {
  goalMl: number | null;
  autoGoalMl: number;
  glassSizeMl: number;
  wakeStart: string;
  wakeEnd: string;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
}) {
  const [isAuto, setIsAuto] = React.useState(goalMl == null);
  const [notif, setNotif] = React.useState(notificationsEnabled);
  const [sound, setSound] = React.useState(soundEnabled);

  return (
    <form action={updateWaterConfigAction} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="goalMl">Meta diária</Label>
        <div className="flex items-center gap-2">
          <Checkbox checked={isAuto} onCheckedChange={setIsAuto} />
          <span className="text-xs text-muted-foreground">Auto (35ml × peso)</span>
        </div>
        <Input
          id="goalMl"
          name="goalMl"
          type="number"
          min={500}
          max={6000}
          step={100}
          defaultValue={isAuto ? "" : (goalMl ?? autoGoalMl)}
          placeholder={`auto: ${autoGoalMl}ml`}
          disabled={isAuto}
        />
        {isAuto && (
          <>
            <input type="hidden" name="goalMl" value="auto" />
            <p className="text-[10px] text-muted-foreground">
              Calculado do último peso ({autoGoalMl}ml). Loge peso pra atualizar.
            </p>
          </>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <Label htmlFor="glassSizeMl">Copo (ml)</Label>
          <Select id="glassSizeMl" name="glassSizeMl" defaultValue={String(glassSizeMl)}>
            <option value="150">150</option>
            <option value="200">200</option>
            <option value="250">250</option>
            <option value="300">300</option>
            <option value="500">500</option>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="wakeStart">Acorda</Label>
          <Input id="wakeStart" name="wakeStart" type="time" defaultValue={wakeStart} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="wakeEnd">Dorme</Label>
          <Input id="wakeEnd" name="wakeEnd" type="time" defaultValue={wakeEnd} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={notif} onCheckedChange={setNotif} />
        <span>Notificações</span>
        <input type="hidden" name="notificationsEnabled" value={notif ? "1" : "0"} />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={sound} onCheckedChange={setSound} />
        <span>Som ao beber</span>
        <input type="hidden" name="soundEnabled" value={sound ? "1" : "0"} />
      </label>

      <Button type="submit" className="w-full">
        Salvar configuração
      </Button>
    </form>
  );
}
