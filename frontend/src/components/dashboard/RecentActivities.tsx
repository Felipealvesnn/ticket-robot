"use client";

import { ActivityIcon } from "@/components/ActivityIcon";
import { Activity } from "@/types/dashboard";

interface RecentActivitiesProps {
  activities: Activity[];
  isLoading?: boolean;
}

export default function RecentActivities({
  activities,
  isLoading,
}: RecentActivitiesProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Atividade Recente
            </h3>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Tempo Real
            </span>
          </div>
        </div>
        <div className="p-6">
          <div className="flow-root">
            <ul className="-mb-8">
              {[...Array(5)].map((_, index) => (
                <li key={index}>
                  <div className="relative pb-8">
                    {index !== 4 && (
                      <span
                        className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse" />
                        <div className="w-1/2 h-3 bg-gray-200 rounded animate-pulse" />
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Atividade Recente
          </h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Tempo Real
          </span>
        </div>
      </div>
      <div className="p-6">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Nenhuma atividade
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              As atividades recentes aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="flow-root">
            <ul className="-mb-8">
              {activities.map((activity, index) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {index !== activities.length - 1 && (
                      <span
                        className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex items-start space-x-3">
                      <div
                        className={`relative px-1 ${
                          activity.type === "success"
                            ? "bg-green-500"
                            : activity.type === "info"
                            ? "bg-blue-500"
                            : activity.type === "warning"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        } rounded-full flex items-center justify-center h-10 w-10`}
                      >
                        <ActivityIcon
                          icon={activity.icon}
                          className="w-5 h-5 text-white"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div>
                          <div className="text-sm">
                            <p className="font-medium text-gray-900">
                              {activity.action}
                            </p>
                          </div>
                          <p className="mt-0.5 text-sm text-gray-500">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
