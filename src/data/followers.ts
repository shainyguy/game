import { Follower } from '../game/types';

// Список подписчиков @medvedev.tech
// Чтобы добавить нового подписчика:
// 1. Добавьте объект в массив FOLLOWERS
// 2. Укажите уникальный id, username и дату подписки
// 3. Опционально добавьте avatar с путём к картинке (например: "photo/1.jpg")

export const FOLLOWERS: Follower[] = [
  {
    id: "1",
    username: "witlessss",
    joinedAt: "2024-01-01T10:00:00Z",
    avatar: "photo/1.jpg"
  },
  {
    id: "2",
    username: "astrey.store",
    joinedAt: "2024-01-02T11:00:00Z",
    avatar: "photo/2.jpg"
  },
  {
    id: "3",
    username: "y_biryukova00",
    joinedAt: "2024-01-03T12:00:00Z",
    avatar: "photo/3.jpg"
  },
  {
    id: "4",
    username: "alenchik_sergeevna_",
    joinedAt: "2024-01-04T13:00:00Z",
    avatar: "photo/4.jpg"
  },
  {
    id: "5",
    username: "yulya485",
    joinedAt: "2024-01-05T14:00:00Z",
    avatar: "photo/5.jpg"
  },
  {
    id: "6",
    username: "odnodvorccev",
    joinedAt: "2024-01-06T15:00:00Z",
    avatar: "photo/6.jpg"
  },
  {
    id: "7",
    username: "yazykovamary",
    joinedAt: "2024-01-07T16:00:00Z",
    avatar: "photo/7.jpg"
  },
  {
    id: "8",
    username: "elena.48rus_",
    joinedAt: "2024-01-08T17:00:00Z",
    avatar: "photo/8.jpg"
  },
  {
    id: "9",
    username: "80l90v",
    joinedAt: "2024-01-09T18:00:00Z",
    avatar: "photo/9.jpg"
  },
  {
    id: "10",
    username: "lunataro.bot",
    joinedAt: "2024-01-10T19:00:00Z",
    avatar: "photo/10.jpg"
  },
  {
    id: "11",
    username: "lashdiva_nz",
    joinedAt: "2024-01-11T20:00:00Z",
    avatar: "photo/11.jpg"
  },
  {
    id: "12",
    username: "_d.evgeniya_",
    joinedAt: "2024-01-12T21:00:00Z",
    avatar: "photo/12.jpg"
  },
  {
    id: "13",
    username: "mk.tarot_",
    joinedAt: "2024-01-13T22:00:00Z",
    avatar: "photo/13.jpg"
  },
   {
    id: "14",
    username: "sun_beeeeeam231",
    joinedAt: "2026-02-25T22:00:00Z",
    avatar: "photo/14.jpg"
  },
   {
    id: "15",
    username: "ai_aksenova",
    joinedAt: "2026-02-25T22:00:00Z",
    avatar: "photo/15.jpg"
  },
   {
    id: "16",
    username: "zhrlv.a",
    joinedAt: "2026-02-25T22:00:00Z",
    avatar: "photo/16.jpg"
  }
];

// Функция для добавления нового подписчика (для использования в коде)
export function addFollower(username: string, avatar?: string): Follower {
  const newId = (FOLLOWERS.length + 1).toString();
  const newFollower: Follower = {
    id: newId,
    username,
    joinedAt: new Date().toISOString(),
    avatar: avatar || ""
  };
  FOLLOWERS.push(newFollower);
  return newFollower;
}
