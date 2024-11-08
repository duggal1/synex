import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, BarChart3, DollarSign, Users, ArrowUpRight, ArrowDownRight, Box, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";


const DashboardPage = () => {
  return (
  
    <div className="flex flex-col gap-8 p-8">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-bold text-4xl">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">Welcome back, Administrator</p>
        </div>
        <Button className="bg-gradient-to-r from-indigo-500 hover:from-indigo-600 to-purple-500 hover:to-purple-600">
          Generate Report
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {[
          {
            title: "Total Revenue",
            value: "$84,234.00",
            change: "+12.5%",
            icon: DollarSign,
            positive: true,
          },
          {
            title: "Active Users",
            value: "2,234",
            change: "+18.2%",
            icon: Users,
            positive: true,
          },
          {
            title: "Conversion Rate",
            value: "4.3%",
            change: "-2.1%",
            icon: BarChart3,
            positive: false,
          },
          {
            title: "Active Sessions",
            value: "1,234",
            change: "+8.1%",
            icon: Activity,
            positive: true,
          },
        ].map((stat, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div className="bg-primary/10 p-3 rounded-lg">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <span className={`flex items-center text-sm ${stat.positive ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.change}
                  {stat.positive ? <ArrowUpRight className="ml-1 w-4 h-4" /> : <ArrowDownRight className="ml-1 w-4 h-4" />}
                </span>
              </div>
              <div className="mt-4">
                <p className="font-bold text-3xl">{stat.value}</p>
                <p className="mt-1 text-muted-foreground">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="gap-6 grid grid-cols-1 lg:grid-cols-6">
        {/* Activity Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
            <CardDescription>System activity for the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center items-center border border-dashed rounded-lg h-[350px]">
              [Activity Chart Placeholder]
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                {
                  icon: Box,
                  title: "New deployment",
                  description: "Production server updated",
                  time: "2 min ago",
                },
                {
                  icon: Users,
                  title: "New user signup",
                  description: "Enterprise plan activated",
                  time: "15 min ago",
                },
                {
                  icon: Activity,
                  title: "System alert",
                  description: "CPU usage peaked",
                  time: "1 hour ago",
                },
              ].map((activity, index) => (
                <div key={index} className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <activity.icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">{activity.title}</p>
                    <p className="text-muted-foreground text-sm">
                      {activity.description}
                    </p>
                    <div className="flex items-center text-muted-foreground text-xs">
                      <Clock className="mr-1 w-3 h-3" />
                      {activity.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Project Status */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Project Status</CardTitle>
            <CardDescription>Current project milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { name: "System Architecture", progress: 85 },
                { name: "Frontend Development", progress: 65 },
                { name: "Database Migration", progress: 42 },
              ].map((project, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{project.name}</span>
                    <span className="text-muted-foreground">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Real-time performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { name: "CPU Usage", value: "42%", status: "normal" },
                { name: "Memory Usage", value: "68%", status: "warning" },
                { name: "Storage", value: "23%", status: "normal" },
              ].map((metric, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="font-medium">{metric.name}</span>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    metric.status === "normal" 
                      ? "bg-green-500/10 text-green-500" 
                      : "bg-yellow-500/10 text-yellow-500"
                  }`}>
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  
  );
};

export default DashboardPage;
