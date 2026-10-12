import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RevenueStatsCardProps {
  title: string;
  value: number;
  icon: JSX.Element;
}

export function RevenueStatsCard({ title, value, icon }: RevenueStatsCardProps) {
  return (
<Card className="flex flex-col justify-between p-4 w-full sm:w-[16rem] md:w-[18rem] lg:w-[20rem] rounded-md shadow-md hover:shadow-lg transition-shadow duration-300 bg-white text-gray-900">
<CardHeader className="w-full p-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <div className="text-xl">{icon}</div>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-xs text-gray-500 mt-1">Change: <span className="font-medium text-green-500">+0% from last month</span></p>
      </CardContent>
    </Card>
  );
}
