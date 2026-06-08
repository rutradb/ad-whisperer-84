import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/useAuthStore";
import { useAds } from "@/hooks/useAds";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConnectionBanner } from "@/components/ConnectionBanner";
import { Bell, ExternalLink } from "lucide-react";

function approvalBadge(status: string) {
  switch (status) {
    case "APPROVED": return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>;
    case "APPROVED_LIMITED": return <Badge className="bg-yellow-100 text-yellow-800">Aprovado com restricoes</Badge>;
    case "DISAPPROVED": return <Badge className="bg-red-100 text-red-800">Reprovado</Badge>;
    case "AREA_OF_INTEREST_ONLY": return <Badge className="bg-blue-100 text-blue-800">Area de interesse</Badge>;
    case "UNDER_REVIEW": return <Badge className="bg-gray-100 text-gray-800">Em revisao</Badge>;
    default: return <Badge variant="outline">{status || "Desconhecido"}</Badge>;
  }
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { selectedCustomer } = useAuthStore();
  const accountId = selectedCustomer?.id;

  const { data, isLoading } = useAds(accountId ?? undefined, { limit: 200 });

  if (!accountId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Notificacoes</h1>
        <ConnectionBanner />
      </div>
    );
  }

  const ads = data || [];

  // Google Ads: policySummary.approvalStatus
  const disapproved = ads.filter((ad: any) => {
    const status = ad.policySummary?.approvalStatus || ad.ad?.policySummary?.approvalStatus || "";
    return status === "DISAPPROVED" || status === "APPROVED_LIMITED";
  });

  const underReview = ads.filter((ad: any) => {
    const status = ad.policySummary?.approvalStatus || ad.ad?.policySummary?.approvalStatus || "";
    return !status || status === "UNDER_REVIEW" || status === "REVIEW_IN_PROGRESS";
  });

  const approved = ads.filter((ad: any) => {
    const status = ad.policySummary?.approvalStatus || ad.ad?.policySummary?.approvalStatus || "";
    return status === "APPROVED";
  });

  const getAdName = (ad: any) => {
    // RSA: use first headline
    const headlines = ad.ad?.responsiveSearchAd?.headlines || [];
    if (headlines.length > 0) return headlines[0]?.text || "Anuncio sem titulo";
    return ad.ad?.name || ad.name || `Anuncio ${ad.ad?.id || ad.id || ""}`;
  };

  const getAdId = (ad: any) => ad.ad?.id || ad.id || "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Bell className="h-6 w-6" />Notificacoes
        </h1>
        <p className="text-muted-foreground">Status de revisao dos seus anuncios ({ads.length} anuncios)</p>
      </div>

      {/* Disapproved / Limited */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-destructive">Anuncios com Problemas ({disapproved.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : disapproved.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Anuncio</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Revisao</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disapproved.map((ad: any, i: number) => (
                  <TableRow key={getAdId(ad) || i}>
                    <TableCell className="font-medium max-w-[300px] truncate">{getAdName(ad)}</TableCell>
                    <TableCell className="text-sm">{ad.status || "—"}</TableCell>
                    <TableCell>{approvalBadge(ad.policySummary?.approvalStatus || ad.ad?.policySummary?.approvalStatus || "")}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/ads/${getAdId(ad)}`)}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-6">Nenhum anuncio com problemas de revisao.</p>
          )}
        </CardContent>
      </Card>

      {/* Under review */}
      {underReview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Em Revisao ({underReview.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Anuncio</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {underReview.slice(0, 30).map((ad: any, i: number) => (
                  <TableRow key={getAdId(ad) || i}>
                    <TableCell className="font-medium max-w-[300px] truncate">{getAdName(ad)}</TableCell>
                    <TableCell className="text-sm">{ad.status || "—"}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/ads/${getAdId(ad)}`)}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Approved summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-green-600">Aprovados ({approved.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{approved.length} anuncio(s) aprovados e funcionando normalmente.</p>
        </CardContent>
      </Card>
    </div>
  );
}
