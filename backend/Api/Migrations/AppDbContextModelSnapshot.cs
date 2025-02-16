﻿// <auto-generated />
using System;
using Api.Common.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Api.Migrations
{
    [DbContext(typeof(AppDbContext))]
    partial class AppDbContextModelSnapshot : ModelSnapshot
    {
        protected override void BuildModel(ModelBuilder modelBuilder)
        {
#pragma warning disable 612, 618
            modelBuilder
                .HasAnnotation("ProductVersion", "9.0.0")
                .HasAnnotation("Relational:MaxIdentifierLength", 63);

            NpgsqlModelBuilderExtensions.UseIdentityByDefaultColumns(modelBuilder);

            modelBuilder.Entity("AppAny.Quartz.EntityFrameworkCore.Migrations.QuartzBlobTrigger", b =>
                {
                    b.Property<string>("SchedulerName")
                        .HasColumnType("text")
                        .HasColumnName("sched_name");

                    b.Property<string>("TriggerName")
                        .HasColumnType("text")
                        .HasColumnName("trigger_name");

                    b.Property<string>("TriggerGroup")
                        .HasColumnType("text")
                        .HasColumnName("trigger_group");

                    b.Property<byte[]>("BlobData")
                        .HasColumnType("bytea")
                        .HasColumnName("blob_data");

                    b.HasKey("SchedulerName", "TriggerName", "TriggerGroup");

                    b.ToTable("qrtz_blob_triggers", "quartz");
                });

            modelBuilder.Entity("AppAny.Quartz.EntityFrameworkCore.Migrations.QuartzCalendar", b =>
                {
                    b.Property<string>("SchedulerName")
                        .HasColumnType("text")
                        .HasColumnName("sched_name");

                    b.Property<string>("CalendarName")
                        .HasColumnType("text")
                        .HasColumnName("calendar_name");

                    b.Property<byte[]>("Calendar")
                        .IsRequired()
                        .HasColumnType("bytea")
                        .HasColumnName("calendar");

                    b.HasKey("SchedulerName", "CalendarName");

                    b.ToTable("qrtz_calendars", "quartz");
                });

            modelBuilder.Entity("AppAny.Quartz.EntityFrameworkCore.Migrations.QuartzCronTrigger", b =>
                {
                    b.Property<string>("SchedulerName")
                        .HasColumnType("text")
                        .HasColumnName("sched_name");

                    b.Property<string>("TriggerName")
                        .HasColumnType("text")
                        .HasColumnName("trigger_name");

                    b.Property<string>("TriggerGroup")
                        .HasColumnType("text")
                        .HasColumnName("trigger_group");

                    b.Property<string>("CronExpression")
                        .IsRequired()
                        .HasColumnType("text")
                        .HasColumnName("cron_expression");

                    b.Property<string>("TimeZoneId")
                        .HasColumnType("text")
                        .HasColumnName("time_zone_id");

                    b.HasKey("SchedulerName", "TriggerName", "TriggerGroup");

                    b.ToTable("qrtz_cron_triggers", "quartz");
                });

            modelBuilder.Entity("AppAny.Quartz.EntityFrameworkCore.Migrations.QuartzFiredTrigger", b =>
                {
                    b.Property<string>("SchedulerName")
                        .HasColumnType("text")
                        .HasColumnName("sched_name");

                    b.Property<string>("EntryId")
                        .HasColumnType("text")
                        .HasColumnName("entry_id");

                    b.Property<long>("FiredTime")
                        .HasColumnType("bigint")
                        .HasColumnName("fired_time");

                    b.Property<string>("InstanceName")
                        .IsRequired()
                        .HasColumnType("text")
                        .HasColumnName("instance_name");

                    b.Property<bool>("IsNonConcurrent")
                        .HasColumnType("bool")
                        .HasColumnName("is_nonconcurrent");

                    b.Property<string>("JobGroup")
                        .HasColumnType("text")
                        .HasColumnName("job_group");

                    b.Property<string>("JobName")
                        .HasColumnType("text")
                        .HasColumnName("job_name");

                    b.Property<int>("Priority")
                        .HasColumnType("integer")
                        .HasColumnName("priority");

                    b.Property<bool?>("RequestsRecovery")
                        .HasColumnType("bool")
                        .HasColumnName("requests_recovery");

                    b.Property<long>("ScheduledTime")
                        .HasColumnType("bigint")
                        .HasColumnName("sched_time");

                    b.Property<string>("State")
                        .IsRequired()
                        .HasColumnType("text")
                        .HasColumnName("state");

                    b.Property<string>("TriggerGroup")
                        .IsRequired()
                        .HasColumnType("text")
                        .HasColumnName("trigger_group");

                    b.Property<string>("TriggerName")
                        .IsRequired()
                        .HasColumnType("text")
                        .HasColumnName("trigger_name");

                    b.HasKey("SchedulerName", "EntryId");

                    b.HasIndex("InstanceName")
                        .HasDatabaseName("idx_qrtz_ft_trig_inst_name");

                    b.HasIndex("JobGroup")
                        .HasDatabaseName("idx_qrtz_ft_job_group");

                    b.HasIndex("JobName")
                        .HasDatabaseName("idx_qrtz_ft_job_name");

                    b.HasIndex("RequestsRecovery")
                        .HasDatabaseName("idx_qrtz_ft_job_req_recovery");

                    b.HasIndex("TriggerGroup")
                        .HasDatabaseName("idx_qrtz_ft_trig_group");

                    b.HasIndex("TriggerName")
                        .HasDatabaseName("idx_qrtz_ft_trig_name");

                    b.HasIndex("SchedulerName", "TriggerName", "TriggerGroup")
                        .HasDatabaseName("idx_qrtz_ft_trig_nm_gp");

                    b.ToTable("qrtz_fired_triggers", "quartz");
                });

            modelBuilder.Entity("AppAny.Quartz.EntityFrameworkCore.Migrations.QuartzJobDetail", b =>
                {
                    b.Property<string>("SchedulerName")
                        .HasColumnType("text")
                        .HasColumnName("sched_name");

                    b.Property<string>("JobName")
                        .HasColumnType("text")
                        .HasColumnName("job_name");

                    b.Property<string>("JobGroup")
                        .HasColumnType("text")
                        .HasColumnName("job_group");

                    b.Property<string>("Description")
                        .HasColumnType("text")
                        .HasColumnName("description");

                    b.Property<bool>("IsDurable")
                        .HasColumnType("bool")
                        .HasColumnName("is_durable");

                    b.Property<bool>("IsNonConcurrent")
                        .HasColumnType("bool")
                        .HasColumnName("is_nonconcurrent");

                    b.Property<bool>("IsUpdateData")
                        .HasColumnType("bool")
                        .HasColumnName("is_update_data");

                    b.Property<string>("JobClassName")
                        .IsRequired()
                        .HasColumnType("text")
                        .HasColumnName("job_class_name");

                    b.Property<byte[]>("JobData")
                        .HasColumnType("bytea")
                        .HasColumnName("job_data");

                    b.Property<bool>("RequestsRecovery")
                        .HasColumnType("bool")
                        .HasColumnName("requests_recovery");

                    b.HasKey("SchedulerName", "JobName", "JobGroup");

                    b.HasIndex("RequestsRecovery")
                        .HasDatabaseName("idx_qrtz_j_req_recovery");

                    b.ToTable("qrtz_job_details", "quartz");
                });

            modelBuilder.Entity("AppAny.Quartz.EntityFrameworkCore.Migrations.QuartzLock", b =>
                {
                    b.Property<string>("SchedulerName")
                        .HasColumnType("text")
                        .HasColumnName("sched_name");

                    b.Property<string>("LockName")
                        .HasColumnType("text")
                        .HasColumnName("lock_name");

                    b.HasKey("SchedulerName", "LockName");

                    b.ToTable("qrtz_locks", "quartz");
                });

            modelBuilder.Entity("AppAny.Quartz.EntityFrameworkCore.Migrations.QuartzPausedTriggerGroup", b =>
                {
                    b.Property<string>("SchedulerName")
                        .HasColumnType("text")
                        .HasColumnName("sched_name");

                    b.Property<string>("TriggerGroup")
                        .HasColumnType("text")
                        .HasColumnName("trigger_group");

                    b.HasKey("SchedulerName", "TriggerGroup");

                    b.ToTable("qrtz_paused_trigger_grps", "quartz");
                });

            modelBuilder.Entity("AppAny.Quartz.EntityFrameworkCore.Migrations.QuartzSchedulerState", b =>
                {
                    b.Property<string>("SchedulerName")
                        .HasColumnType("text")
                        .HasColumnName("sched_name");

                    b.Property<string>("InstanceName")
                        .HasColumnType("text")
                        .HasColumnName("instance_name");

                    b.Property<long>("CheckInInterval")
                        .HasColumnType("bigint")
                        .HasColumnName("checkin_interval");

                    b.Property<long>("LastCheckInTime")
                        .HasColumnType("bigint")
                        .HasColumnName("last_checkin_time");

                    b.HasKey("SchedulerName", "InstanceName");

                    b.ToTable("qrtz_scheduler_state", "quartz");
                });

            modelBuilder.Entity("AppAny.Quartz.EntityFrameworkCore.Migrations.QuartzSimplePropertyTrigger", b =>
                {
                    b.Property<string>("SchedulerName")
                        .HasColumnType("text")
                        .HasColumnName("sched_name");

                    b.Property<string>("TriggerName")
                        .HasColumnType("text")
                        .HasColumnName("trigger_name");

                    b.Property<string>("TriggerGroup")
                        .HasColumnType("text")
                        .HasColumnName("trigger_group");

                    b.Property<bool?>("BooleanProperty1")
                        .HasColumnType("bool")
                        .HasColumnName("bool_prop_1");

                    b.Property<bool?>("BooleanProperty2")
                        .HasColumnType("bool")
                        .HasColumnName("bool_prop_2");

                    b.Property<decimal?>("DecimalProperty1")
                        .HasColumnType("numeric")
                        .HasColumnName("dec_prop_1");

                    b.Property<decimal?>("DecimalProperty2")
                        .HasColumnType("numeric")
                        .HasColumnName("dec_prop_2");

                    b.Property<int?>("IntegerProperty1")
                        .HasColumnType("integer")
                        .HasColumnName("int_prop_1");

                    b.Property<int?>("IntegerProperty2")
                        .HasColumnType("integer")
                        .HasColumnName("int_prop_2");

                    b.Property<long?>("LongProperty1")
                        .HasColumnType("bigint")
                        .HasColumnName("long_prop_1");

                    b.Property<long?>("LongProperty2")
                        .HasColumnType("bigint")
                        .HasColumnName("long_prop_2");

                    b.Property<string>("StringProperty1")
                        .HasColumnType("text")
                        .HasColumnName("str_prop_1");

                    b.Property<string>("StringProperty2")
                        .HasColumnType("text")
                        .HasColumnName("str_prop_2");

                    b.Property<string>("StringProperty3")
                        .HasColumnType("text")
                        .HasColumnName("str_prop_3");

                    b.Property<string>("TimeZoneId")
                        .HasColumnType("text")
                        .HasColumnName("time_zone_id");

                    b.HasKey("SchedulerName", "TriggerName", "TriggerGroup");

                    b.ToTable("qrtz_simprop_triggers", "quartz");
                });

            modelBuilder.Entity("AppAny.Quartz.EntityFrameworkCore.Migrations.QuartzSimpleTrigger", b =>
                {
                    b.Property<string>("SchedulerName")
                        .HasColumnType("text")
                        .HasColumnName("sched_name");

                    b.Property<string>("TriggerName")
                        .HasColumnType("text")
                        .HasColumnName("trigger_name");

                    b.Property<string>("TriggerGroup")
                        .HasColumnType("text")
                        .HasColumnName("trigger_group");

                    b.Property<long>("RepeatCount")
                        .HasColumnType("bigint")
                        .HasColumnName("repeat_count");

                    b.Property<long>("RepeatInterval")
                        .HasColumnType("bigint")
                        .HasColumnName("repeat_interval");

                    b.Property<long>("TimesTriggered")
                        .HasColumnType("bigint")
                        .HasColumnName("times_triggered");

                    b.HasKey("SchedulerName", "TriggerName", "TriggerGroup");

                    b.ToTable("qrtz_simple_triggers", "quartz");
                });

            modelBuilder.Entity("AppAny.Quartz.EntityFrameworkCore.Migrations.QuartzTrigger", b =>
                {
                    b.Property<string>("SchedulerName")
                        .HasColumnType("text")
                        .HasColumnName("sched_name");

                    b.Property<string>("TriggerName")
                        .HasColumnType("text")
                        .HasColumnName("trigger_name");

                    b.Property<string>("TriggerGroup")
                        .HasColumnType("text")
                        .HasColumnName("trigger_group");

                    b.Property<string>("CalendarName")
                        .HasColumnType("text")
                        .HasColumnName("calendar_name");

                    b.Property<string>("Description")
                        .HasColumnType("text")
                        .HasColumnName("description");

                    b.Property<long?>("EndTime")
                        .HasColumnType("bigint")
                        .HasColumnName("end_time");

                    b.Property<byte[]>("JobData")
                        .HasColumnType("bytea")
                        .HasColumnName("job_data");

                    b.Property<string>("JobGroup")
                        .IsRequired()
                        .HasColumnType("text")
                        .HasColumnName("job_group");

                    b.Property<string>("JobName")
                        .IsRequired()
                        .HasColumnType("text")
                        .HasColumnName("job_name");

                    b.Property<short?>("MisfireInstruction")
                        .HasColumnType("smallint")
                        .HasColumnName("misfire_instr");

                    b.Property<long?>("NextFireTime")
                        .HasColumnType("bigint")
                        .HasColumnName("next_fire_time");

                    b.Property<long?>("PreviousFireTime")
                        .HasColumnType("bigint")
                        .HasColumnName("prev_fire_time");

                    b.Property<int?>("Priority")
                        .HasColumnType("integer")
                        .HasColumnName("priority");

                    b.Property<long>("StartTime")
                        .HasColumnType("bigint")
                        .HasColumnName("start_time");

                    b.Property<string>("TriggerState")
                        .IsRequired()
                        .HasColumnType("text")
                        .HasColumnName("trigger_state");

                    b.Property<string>("TriggerType")
                        .IsRequired()
                        .HasColumnType("text")
                        .HasColumnName("trigger_type");

                    b.HasKey("SchedulerName", "TriggerName", "TriggerGroup");

                    b.HasIndex("NextFireTime")
                        .HasDatabaseName("idx_qrtz_t_next_fire_time");

                    b.HasIndex("TriggerState")
                        .HasDatabaseName("idx_qrtz_t_state");

                    b.HasIndex("NextFireTime", "TriggerState")
                        .HasDatabaseName("idx_qrtz_t_nft_st");

                    b.HasIndex("SchedulerName", "JobName", "JobGroup");

                    b.ToTable("qrtz_triggers", "quartz");
                });

            modelBuilder.Entity("Domain.ParkingSpots.ParkingSpot", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid");

                    b.Property<string>("OwnerId")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<Guid>("ParkingId")
                        .HasColumnType("uuid");

                    b.Property<string>("SpotName")
                        .IsRequired()
                        .HasMaxLength(10)
                        .HasColumnType("character varying(10)");

                    b.HasKey("Id");

                    b.HasIndex("OwnerId")
                        .IsUnique();

                    b.HasIndex("ParkingId");

                    b.HasIndex("OwnerId", "SpotName")
                        .IsUnique();

                    b.ToTable("ParkingSpot");
                });

            modelBuilder.Entity("Domain.Parkings.Parking", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid");

                    b.Property<string>("Address")
                        .IsRequired()
                        .HasMaxLength(100)
                        .HasColumnType("character varying(100)");

                    b.Property<string>("Name")
                        .IsRequired()
                        .HasMaxLength(50)
                        .HasColumnType("character varying(50)");

                    b.HasKey("Id");

                    b.ToTable("Parking");
                });

            modelBuilder.Entity("Domain.Users.User", b =>
                {
                    b.Property<string>("Identity")
                        .HasColumnType("text");

                    b.Property<string>("DisplayName")
                        .IsRequired()
                        .HasColumnType("text");

                    b.Property<string>("PictureUrl")
                        .HasColumnType("text");

                    b.HasKey("Identity");

                    b.ToTable("User");
                });

            modelBuilder.Entity("Domain.Wallets.Wallet", b =>
                {
                    b.Property<Guid>("Id")
                        .ValueGeneratedOnAdd()
                        .HasColumnType("uuid");

                    b.Property<string>("UserId")
                        .IsRequired()
                        .HasColumnType("text");

                    b.HasKey("Id");

                    b.HasIndex("UserId")
                        .IsUnique();

                    b.ToTable("Wallet");
                });

            modelBuilder.Entity("AppAny.Quartz.EntityFrameworkCore.Migrations.QuartzBlobTrigger", b =>
                {
                    b.HasOne("AppAny.Quartz.EntityFrameworkCore.Migrations.QuartzTrigger", "Trigger")
                        .WithMany("BlobTriggers")
                        .HasForeignKey("SchedulerName", "TriggerName", "TriggerGroup")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Trigger");
                });

            modelBuilder.Entity("AppAny.Quartz.EntityFrameworkCore.Migrations.QuartzCronTrigger", b =>
                {
                    b.HasOne("AppAny.Quartz.EntityFrameworkCore.Migrations.QuartzTrigger", "Trigger")
                        .WithMany("CronTriggers")
                        .HasForeignKey("SchedulerName", "TriggerName", "TriggerGroup")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Trigger");
                });

            modelBuilder.Entity("AppAny.Quartz.EntityFrameworkCore.Migrations.QuartzSimplePropertyTrigger", b =>
                {
                    b.HasOne("AppAny.Quartz.EntityFrameworkCore.Migrations.QuartzTrigger", "Trigger")
                        .WithMany("SimplePropertyTriggers")
                        .HasForeignKey("SchedulerName", "TriggerName", "TriggerGroup")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Trigger");
                });

            modelBuilder.Entity("AppAny.Quartz.EntityFrameworkCore.Migrations.QuartzSimpleTrigger", b =>
                {
                    b.HasOne("AppAny.Quartz.EntityFrameworkCore.Migrations.QuartzTrigger", "Trigger")
                        .WithMany("SimpleTriggers")
                        .HasForeignKey("SchedulerName", "TriggerName", "TriggerGroup")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("Trigger");
                });

            modelBuilder.Entity("AppAny.Quartz.EntityFrameworkCore.Migrations.QuartzTrigger", b =>
                {
                    b.HasOne("AppAny.Quartz.EntityFrameworkCore.Migrations.QuartzJobDetail", "JobDetail")
                        .WithMany("Triggers")
                        .HasForeignKey("SchedulerName", "JobName", "JobGroup")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.Navigation("JobDetail");
                });

            modelBuilder.Entity("Domain.ParkingSpots.ParkingSpot", b =>
                {
                    b.HasOne("Domain.Users.User", null)
                        .WithOne()
                        .HasForeignKey("Domain.ParkingSpots.ParkingSpot", "OwnerId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.HasOne("Domain.Parkings.Parking", null)
                        .WithMany()
                        .HasForeignKey("ParkingId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.OwnsMany("Domain.ParkingSpots.ParkingSpotAvailability", "Availabilities", b1 =>
                        {
                            b1.Property<Guid>("ParkingSpotId")
                                .HasColumnType("uuid");

                            b1.Property<Guid>("Id")
                                .ValueGeneratedOnAdd()
                                .HasColumnType("uuid");

                            b1.Property<DateTimeOffset>("From")
                                .HasColumnType("timestamp with time zone");

                            b1.Property<DateTimeOffset>("To")
                                .HasColumnType("timestamp with time zone");

                            b1.HasKey("ParkingSpotId", "Id");

                            b1.ToTable("ParkingSpotAvailability");

                            b1.WithOwner()
                                .HasForeignKey("ParkingSpotId");
                        });

                    b.OwnsMany("Domain.ParkingSpots.ParkingSpotBooking", "Bookings", b1 =>
                        {
                            b1.Property<Guid>("ParkingSpotId")
                                .HasColumnType("uuid");

                            b1.Property<Guid>("Id")
                                .ValueGeneratedOnAdd()
                                .HasColumnType("uuid");

                            b1.Property<string>("BookingUserId")
                                .IsRequired()
                                .HasColumnType("text");

                            b1.Property<DateTimeOffset>("From")
                                .HasColumnType("timestamp with time zone");

                            b1.Property<int?>("Rating")
                                .HasColumnType("integer");

                            b1.Property<DateTimeOffset>("To")
                                .HasColumnType("timestamp with time zone");

                            b1.HasKey("ParkingSpotId", "Id");

                            b1.HasIndex("BookingUserId");

                            b1.ToTable("ParkingSpotBooking");

                            b1.HasOne("Domain.Users.User", null)
                                .WithMany()
                                .HasForeignKey("BookingUserId")
                                .OnDelete(DeleteBehavior.Cascade)
                                .IsRequired();

                            b1.WithOwner()
                                .HasForeignKey("ParkingSpotId");
                        });

                    b.Navigation("Availabilities");

                    b.Navigation("Bookings");
                });

            modelBuilder.Entity("Domain.Users.User", b =>
                {
                    b.OwnsOne("Domain.Users.UserRating", "Rating", b1 =>
                        {
                            b1.Property<string>("UserIdentity")
                                .HasColumnType("text");

                            b1.Property<decimal>("Rating")
                                .HasColumnType("numeric");

                            b1.HasKey("UserIdentity");

                            b1.ToTable("User");

                            b1.WithOwner()
                                .HasForeignKey("UserIdentity");
                        });

                    b.Navigation("Rating")
                        .IsRequired();
                });

            modelBuilder.Entity("Domain.Wallets.Wallet", b =>
                {
                    b.HasOne("Domain.Users.User", null)
                        .WithOne()
                        .HasForeignKey("Domain.Wallets.Wallet", "UserId")
                        .OnDelete(DeleteBehavior.Cascade)
                        .IsRequired();

                    b.OwnsMany("Domain.Wallets.CreditsTransaction", "Transactions", b1 =>
                        {
                            b1.Property<Guid>("WalletId")
                                .HasColumnType("uuid");

                            b1.Property<int>("Id")
                                .ValueGeneratedOnAdd()
                                .HasColumnType("integer");

                            NpgsqlPropertyBuilderExtensions.UseIdentityByDefaultColumn(b1.Property<int>("Id"));

                            b1.Property<decimal>("Credits")
                                .HasColumnType("numeric");

                            b1.Property<string>("Reference")
                                .IsRequired()
                                .HasColumnType("text");

                            b1.Property<int>("State")
                                .HasColumnType("integer");

                            b1.HasKey("WalletId", "Id");

                            b1.HasIndex("WalletId", "Reference")
                                .IsUnique();

                            b1.ToTable("CreditsTransaction");

                            b1.WithOwner()
                                .HasForeignKey("WalletId");
                        });

                    b.Navigation("Transactions");
                });

            modelBuilder.Entity("AppAny.Quartz.EntityFrameworkCore.Migrations.QuartzJobDetail", b =>
                {
                    b.Navigation("Triggers");
                });

            modelBuilder.Entity("AppAny.Quartz.EntityFrameworkCore.Migrations.QuartzTrigger", b =>
                {
                    b.Navigation("BlobTriggers");

                    b.Navigation("CronTriggers");

                    b.Navigation("SimplePropertyTriggers");

                    b.Navigation("SimpleTriggers");
                });
#pragma warning restore 612, 618
        }
    }
}
