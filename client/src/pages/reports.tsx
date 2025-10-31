import { FileText, Download, Calendar, TrendingUp, DollarSign, Briefcase } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


export default function Reports() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Reports & Analytics</h1>
        <p className="text-muted-foreground">View detailed reports about your service requests</p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs Posted</CardTitle>
            <Briefcase className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success">+3</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">
              75% completion rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$2,450</div>
            <p className="text-xs text-muted-foreground">
              Across all services
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Reports</TabsTrigger>
          <TabsTrigger value="export">Export Data</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Activity Overview</CardTitle>
              <CardDescription>Your job posting activity over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">Activity chart will be displayed here</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>Jobs by Category</CardTitle>
              <CardDescription>Distribution of your service requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Plumbing', count: 8, color: 'bg-blue-500' },
                  { name: 'Electrical', count: 6, color: 'bg-yellow-500' },
                  { name: 'Carpentry', count: 5, color: 'bg-orange-500' },
                  { name: 'Cleaning', count: 3, color: 'bg-green-500' },
                  { name: 'Other', count: 2, color: 'bg-purple-500' },
                ].map((category) => (
                  <div key={category.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{category.name}</span>
                      <span className="text-muted-foreground">{category.count} jobs</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`${category.color} h-2 rounded-full transition-all`}
                        style={{ width: `${(category.count / 24) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Job History</CardTitle>
              <CardDescription>Detailed breakdown of all your jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    title: 'Fix leaking kitchen sink',
                    date: '2024-01-15',
                    status: 'Completed',
                    provider: 'John Plumber',
                    cost: '$150',
                  },
                  {
                    title: 'Install new ceiling fan',
                    date: '2024-01-10',
                    status: 'Completed',
                    provider: 'Mike Electrician',
                    cost: '$200',
                  },
                  {
                    title: 'Repair wooden deck',
                    date: '2024-01-05',
                    status: 'In Progress',
                    provider: 'Sarah Carpenter',
                    cost: '$450',
                  },
                ].map((job, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="space-y-1">
                      <p className="font-medium">{job.title}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{job.date}</span>
                        <span>•</span>
                        <span>{job.provider}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={job.status === 'Completed' ? 'default' : 'secondary'}>
                        {job.status}
                      </Badge>
                      <span className="font-semibold">{job.cost}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Export Reports</CardTitle>
              <CardDescription>Download your data in various formats</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-2">
                  <CardContent className="pt-6">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">Monthly Report</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Summary of all jobs from the past month
                    </p>
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardContent className="pt-6">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">Custom Date Range</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Export data for a specific time period
                    </p>
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Select & Download
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardContent className="pt-6">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">Transaction History</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      All payment and transaction records
                    </p>
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download CSV
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2">
                  <CardContent className="pt-6">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">Analytics Report</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Detailed analytics and insights
                    </p>
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download Excel
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
