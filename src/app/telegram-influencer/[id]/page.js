"use client";
import { use } from "react";
import TelegramInfluencerProfile from "../../components/InfluencerProfile/TelegramInfluencerProfile";

export default function TelegramInfluencerPage({ params }) {
  const resolvedParams = use(params);
  const channelId = resolvedParams.id;
  
  console.log('TelegramInfluencerPage loaded with channelId:', channelId);

  return <TelegramInfluencerProfile channelId={channelId} />;
}